"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, BarChart3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Message } from "@/components/chat/message";

const suggestions = ["How much did I spend last month?", "What is my biggest expense category?", "Show my income vs expenses trend"];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({ transport: new DefaultChatTransport({ api: "/api/chat" }) });
  const isLoading = status === "submitted" || status === "streaming";
  const submit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!input.trim() || isLoading) return; void sendMessage({ text: input }); setInput(""); };
  return <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-5"><header><p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-primary"><Sparkles className="h-4 w-4" /> Financial assistant</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Ask your money a question.</h1><p className="mt-1 text-muted-foreground">Explore spending, trends, and decisions using the data in your ledger.</p></header><Card className="flex min-h-[540px] flex-1 flex-col overflow-hidden"><CardContent className="flex-1 overflow-y-auto p-4 sm:p-7">{messages.length === 0 ? <div className="flex min-h-[400px] items-center justify-center"><div className="max-w-lg text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><BarChart3 className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-semibold">A clearer conversation with your finances</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Ask a question below, or start with one of these prompts.</p><div className="mt-6 flex flex-wrap justify-center gap-2">{suggestions.map((suggestion) => <Button key={suggestion} variant="outline" size="sm" className="h-auto whitespace-normal py-2 text-left" onClick={() => setInput(suggestion)}>{suggestion}</Button>)}</div></div></div> : <div className="mx-auto max-w-3xl space-y-5">{messages.map((message) => { if (message.role === "system") return null; const content = message.parts.filter((part) => part.type === "text").map((part) => part.text).join(""); return <Message key={message.id} role={message.role} content={content} />; })}{isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Thinking through your numbers...</div>}</div>}</CardContent><div className="border-t bg-muted/20 p-3 sm:p-4"><form onSubmit={submit} className="mx-auto flex max-w-3xl gap-2"><Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your finances..." aria-label="Ask your financial assistant" disabled={isLoading} className="h-11 bg-background" /><Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Send message" disabled={isLoading || !input.trim()}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}</Button></form>{error && <p role="alert" className="mx-auto mt-2 max-w-3xl text-sm text-destructive">Unable to get a response. Please try again.</p>}</div></Card></div>;
}
