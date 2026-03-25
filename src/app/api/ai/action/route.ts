import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getOpenAI } from "@/lib/ai/provider";
import { checkAndIncrementUsage } from "@/lib/services/usage";

const ACTION_PROMPTS: Record<string, string> = {
  "expand-idea": `You are a startup advisor. The user has a rough idea. Expand it into a clear, compelling concept. Include:
- A one-line pitch
- The problem it solves
- Target audience
- Key features (3-5 bullet points)
- Why it's different
Keep it concise and actionable.`,

  "research-topic": `You are a research analyst. Research this topic thoroughly and provide:
- Key facts and context
- Current market landscape
- Major players or competitors
- Opportunities and gaps
- 3 actionable insights
Be specific and data-informed.`,

  "break-into-tasks": `You are a project manager. Break this idea/project into concrete, actionable tasks. Return a JSON array of tasks:
[{"title": "task title", "priority": "high|medium|low", "description": "brief description"}]
Include 5-10 tasks that cover the full scope. Order them logically. Return ONLY the JSON array, no other text.`,

  "suggest-improvements": `You are a product strategist. Look at this idea/project and suggest improvements:
- What's missing?
- What could be better?
- What are potential risks?
- What should be prioritized?
Give 3-5 specific, actionable suggestions.`,

  "write-description": `You are a technical writer. Write a clear, concise description for this task. Include:
- What needs to be done
- Acceptance criteria
- Any technical notes
Keep it to 2-3 sentences.`,

  "break-into-subtasks": `You are a project manager. Break this task into smaller subtasks. Return a JSON array:
[{"title": "subtask title"}]
Include 3-6 subtasks. Return ONLY the JSON array, no other text.`,

  "research-for-task": `You are a research assistant. The user needs help with a specific task. Research and provide:
- How to approach this
- Best practices
- Tools or resources that help
- Common pitfalls to avoid
Be practical and specific.`,

  "suggest-ideas": `You are a creative strategist. Based on the user's existing ideas and interests, suggest 5 new ideas. For each:
- Title (catchy, clear)
- One-line description
- Why it's worth pursuing
Return as a JSON array: [{"title": "...", "body": "..."}]
Return ONLY the JSON array, no other text.`,

  "dashboard-insights": `You are an executive assistant analyzing the user's workspace. Based on their ideas and projects, provide 3-4 brief, actionable insights:
- What needs attention?
- What's been idle too long?
- What should they focus on today?
- Any patterns or suggestions?
Keep each insight to 1-2 sentences. Be direct and helpful.`,
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "AI not configured. Add OPENAI_API_KEY." }, { status: 500 });
  }

  const usage = await checkAndIncrementUsage(userId);
  if (!usage.allowed) {
    return Response.json({ error: `AI limit reached (${usage.used}/${usage.limit})` }, { status: 429 });
  }

  const { action, context } = await req.json();

  const systemPrompt = ACTION_PROMPTS[action];
  if (!systemPrompt) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const result = response.choices[0]?.message?.content || "";

  return Response.json({ result });
}
