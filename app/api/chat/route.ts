import { anthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, stepCountIs, streamText, tool, type ToolSet, type UIMessage } from "ai";
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

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  // Convert tools to AI SDK format
  const aiTools: ToolSet = {};
  
  for (const [name, toolDef] of Object.entries(tools)) {
    aiTools[name] = tool({
      description: toolDef.description,
      inputSchema: toolDef.parameters,
      execute: async (params: unknown) => {
        const execute = toolDef.execute as (
          input: unknown,
          userId: string
        ) => Promise<unknown>;
        return await execute(params, session.user.id);
      },
    });
  }

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-20241022"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: aiTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
