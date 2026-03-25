"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Bot, User, Lightbulb, StickyNote, FileText } from "lucide-react";
import Link from "next/link";

type Citation = {
  itemId: string;
  itemType: string;
  title: string;
  chunkText: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  idea: Lightbulb,
  note: StickyNote,
  script: FileText,
};

const typeHrefs: Record<string, (id: string) => string> = {
  idea: (id) => `/ideas/${id}`,
  note: (id) => `/notes/${id}`,
  script: (id) => `/scripts/${id}`,
};

interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
}

export function ChatInterface({ sessionId, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    const isFirstMessage = messages.length === 0;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    // Add placeholder assistant message
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          isFirstMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.text) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.text }
                  : m
              )
            );
          }

          if (data.done && data.citations) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, citations: data.citations }
                  : m
              )
            );
          }
        }
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages */}
      <ScrollArea className="flex-1 px-2" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-6 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">JottrPad AI</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Ask me anything about your ideas, notes, and scripts. I&apos;ll search
                your workspace and give you grounded answers.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <div className="mt-1 shrink-0">
                {message.role === "user" ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content || (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...new Map(message.citations.map((c) => [`${c.itemType}:${c.itemId}`, c])).values()].map(
                      (citation) => {
                        const Icon = typeIcons[citation.itemType] || FileText;
                        const href = typeHrefs[citation.itemType]?.(citation.itemId) || "#";
                        return (
                          <Link
                            key={`${citation.itemType}:${citation.itemId}`}
                            href={href}
                          >
                            <Badge
                              variant="outline"
                              className="cursor-pointer gap-1 hover:bg-accent"
                            >
                              <Icon className="h-3 w-3" />
                              {citation.title}
                            </Badge>
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your content..."
            disabled={isStreaming}
            autoFocus
          />
          <Button type="submit" disabled={isStreaming || !input.trim()} size="icon">
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
