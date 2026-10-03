import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export const openrouterModel = openrouter(
  process.env.OPENROUTER_MODEL || "openrouter/free"
);
