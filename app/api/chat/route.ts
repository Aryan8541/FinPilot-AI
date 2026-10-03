import { convertToModelMessages, stepCountIs, streamText, tool, type ToolSet, type UIMessage } from "ai";
import { auth } from "@/server/auth";
import { tools } from "@/server/ai/tools";
import { openrouterModel } from "@/server/ai/provider";
import { systemPrompt } from "@/server/ai/system-prompt";
import { logError } from "@/server/logger";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await req.headers,
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json({ error: "AI is not configured." }, { status: 503 });
  }

  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };

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
      model: openrouterModel,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: aiTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError("chat.route", error);
    return Response.json({ error: "AI request failed." }, { status: 500 });
  }
}
