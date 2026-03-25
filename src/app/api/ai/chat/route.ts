import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getOpenAI } from "@/lib/ai/provider";
import { retrieveContext } from "@/lib/ai/retrieval";
import { CHAT_SYSTEM_PROMPT, buildContextPrompt } from "@/lib/ai/prompts";
import { addChatMessage, updateSessionTitle } from "@/lib/services/chat";
import { checkAndIncrementUsage } from "@/lib/services/usage";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  // Check usage limits
  const usage = await checkAndIncrementUsage(userId);
  if (!usage.allowed) {
    return Response.json(
      { error: `AI query limit reached (${usage.used}/${usage.limit}). Upgrade to Pro for more.` },
      { status: 429 }
    );
  }

  const { message, sessionId, isFirstMessage } = await req.json();

  if (!message || !sessionId) {
    return new Response("Missing message or sessionId", { status: 400 });
  }

  // Save user message
  await addChatMessage(sessionId, "user", message);

  // Retrieve relevant context
  const chunks = await retrieveContext(userId, message, 10);

  const contextPrompt = buildContextPrompt(chunks);

  // Build citations for the response
  const citations = chunks.map((c) => ({
    itemId: c.itemId,
    itemType: c.itemType,
    title: c.title,
    chunkText: c.chunkText.slice(0, 200),
  }));

  // Stream response from OpenAI
  const openai = getOpenAI();
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "system", content: contextPrompt },
      { role: "user", content: message },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  // Create a readable stream
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        }
      }

      // Send citations at the end
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, citations })}\n\n`
        )
      );

      controller.close();

      // Save assistant message (non-blocking)
      addChatMessage(sessionId, "assistant", fullResponse, citations).catch(
        console.error
      );

      // Auto-title first message
      if (isFirstMessage) {
        const title =
          message.length > 50 ? message.slice(0, 50) + "..." : message;
        updateSessionTitle(sessionId, title).catch(console.error);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
