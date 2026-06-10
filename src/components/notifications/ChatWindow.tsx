"use client";

import * as React from "react";
import { Send, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage, ConversationData } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

interface ChatWindowProps {
  conversation: ConversationData;
  initialMessages?: ChatMessage[];
  onClose?: () => void;
  className?: string;
}

export function ChatWindow({ conversation, initialMessages = [], onClose, className }: ChatWindowProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const currentUser = conversation.participants.find((p) => p.id === "user-me");
  const otherUser = conversation.participants.find((p) => p.id !== "user-me");

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = React.useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || !currentUser) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatarColor: currentUser.avatarColor,
      text: trimmed,
      time: new Date().toISOString(),
      isIncoming: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    if (otherUser) {
      setIsTyping(true);
      const delay = 1500 + Math.random() * 2000;
      setTimeout(() => {
        setIsTyping(false);
        const reply: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          senderId: otherUser.id,
          senderName: otherUser.name,
          senderAvatarColor: otherUser.avatarColor,
          text: "Thanks for your message! I'll get back to you shortly.",
          time: new Date().toISOString(),
          isIncoming: true,
        };
        setMessages((prev) => [...prev, reply]);
      }, delay);
    }
  }, [inputValue, currentUser, otherUser]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    const textarea = event.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  const showEmptyState = messages.length === 0;

  return (
    <div className={cn("flex h-full flex-col rounded-xl border border-border bg-card shadow-lg", className)}>
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {otherUser && (
              <div className="relative">
                <Avatar name={otherUser.name} color={otherUser.avatarColor} size="md" />
                {otherUser.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {otherUser?.name ?? "Conversation"}
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    otherUser?.online ? "bg-emerald-500" : "bg-muted-foreground/50"
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {otherUser?.online ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted/50 p-4">
              <svg className="size-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No messages yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Say hello to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isSelf = !message.isIncoming;
              const sender = conversation.participants.find((p) => p.id === message.senderId);

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2.5",
                    isSelf ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isSelf && (
                    <Avatar
                      name={message.senderName}
                      color={message.senderAvatarColor}
                      size="sm"
                      className="size-7 shrink-0 text-[10px]"
                    />
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isSelf
                        ? "rounded-br-sm bg-amber-500 text-charcoal-950"
                        : "rounded-bl-sm bg-muted text-foreground"
                    )}
                  >
                    {!isSelf && (
                      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                        {message.senderName}
                      </p>
                    )}
                    <p>{message.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        isSelf ? "text-charcoal-950/60" : "text-muted-foreground/70"
                      )}
                    >
                      {new Date(message.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2.5">
                {otherUser && (
                  <Avatar
                    name={otherUser.name}
                    color={otherUser.avatarColor}
                    size="sm"
                    className="size-7 shrink-0 text-[10px]"
                  />
                )}
                <div className="rounded-bl-sm rounded-br-2xl rounded-tl-2xl rounded-tr-2xl bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-background/50 p-4 backdrop-blur-sm">
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 pr-12 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
