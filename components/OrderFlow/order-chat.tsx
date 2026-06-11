"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconRobot, IconSend, IconUser } from "@tabler/icons-react";
import type { ChatMessage } from "./order-types";

type OrderChatProps = {
  messages: ChatMessage[];
  greeting: string;
  onSend: (text: string) => void;
  restaurantName: string;
};

export function OrderChat({ messages, greeting, onSend, restaurantName }: OrderChatProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text) return;
    onSend(text);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="relative">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <IconRobot className="size-4 text-primary" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Ordering Assistant</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Online · Ordering for {restaurantName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex h-64 flex-col gap-3 overflow-y-auto p-4 scroll-smooth">
        {/* Greeting bubble */}
        <AiBubble text={greeting} />

        {messages.map((msg, i) =>
          msg.role === "ai" ? (
            <AiBubble key={i} text={msg.text} />
          ) : (
            <UserBubble key={i} text={msg.text} />
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t bg-muted/30 px-3 py-2.5">
        <Input
          ref={inputRef}
          placeholder="Ask something or type a special request…"
          className="border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="icon" className="size-8 shrink-0 rounded-xl">
          <IconSend className="size-3.5" />
        </Button>
      </form>
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <IconRobot className="size-3 text-primary" />
      </div>
      <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
        {text}
      </div>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <IconUser className="size-3 text-muted-foreground" />
      </div>
    </div>
  );
}
