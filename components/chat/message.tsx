"use client";

import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export function Message({ role, content, timestamp }: MessageProps) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <Card
        className={`max-w-[80%] p-4 ${
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {timestamp && (
          <p className="mt-2 text-xs opacity-70">
            {format(timestamp, "h:mm a")}
          </p>
        )}
      </Card>
    </div>
  );
}
