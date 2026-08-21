import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { auth } from "@/server/auth";
import { tools } from "@/server/ai/tools";
import { systemPrompt } from "@/server/ai/system-prompt";

export const maxDuration = 30;

export async function POST(req: Request) {
  // Get session
  const session = await auth.api.getSession({
    headers: await req.headers,
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  // Convert tools to AI SDK format
  const aiTools: any = {};
  
  for (const [name, toolDef] of Object.entries(tools)) {
    aiTools[name] = tool({
      description: toolDef.description,
      parameters: toolDef.parameters,
      execute: async (params) => {
        return await toolDef.execute(params, session.user.id);
      },
    });
  }

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    system: systemPrompt,
    messages,
    tools: aiTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
