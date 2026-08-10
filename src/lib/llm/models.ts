import { anthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type LlmProviderId = "claude" | "gemini";

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isGeminiConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim(),
  );
}

/** Claude attempts before switching to Gemini (default 3). */
export function getClaudeMaxAttempts(): number {
  const n = Number(process.env.LLM_CLAUDE_MAX_ATTEMPTS ?? "3");
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(Math.floor(n), 5);
}

export function getClaudeModel(): LanguageModel {
  const modelId = process.env.CHAT_MODEL?.trim() || "claude-sonnet-4-5";
  return anthropic(modelId);
}

export function getGeminiModel(): LanguageModel {
  const modelId = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is not configured",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  return google(modelId);
}

export function assertAnyLlmConfigured(): void {
  if (!isClaudeConfigured() && !isGeminiConfigured()) {
    throw new Error(
      "No LLM configured. Set ANTHROPIC_API_KEY and/or GOOGLE_GENERATIVE_AI_API_KEY",
    );
  }
}
