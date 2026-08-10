import {
  createTextStreamResponse,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  type ModelMessage,
  type UIMessage,
} from "ai";
import {
  assertAnyLlmConfigured,
  getClaudeMaxAttempts,
  getClaudeModel,
  getGeminiModel,
  isClaudeConfigured,
  isGeminiConfigured,
  type LlmProviderId,
} from "@/lib/llm/models";

export type LlmAttemptError = {
  provider: LlmProviderId;
  attempt: number;
  error: string;
};

export class LlmProvidersExhaustedError extends Error {
  readonly attempts: LlmAttemptError[];

  constructor(attempts: LlmAttemptError[]) {
    const summary = attempts
      .map((a) => `${a.provider}#${a.attempt}: ${a.error}`)
      .join(" | ");
    super(`All LLM providers failed. ${summary}`);
    this.name = "LlmProvidersExhaustedError";
    this.attempts = attempts;
  }
}

type StreamParams = {
  system: string;
  temperature?: number;
  prompt?: string;
  messages?: ModelMessage[];
};

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStreamArgs(params: StreamParams) {
  const base = {
    system: params.system,
    temperature: params.temperature,
    maxRetries: 0 as const,
  };

  if (params.messages?.length) {
    return { ...base, messages: params.messages };
  }
  if (params.prompt != null) {
    return { ...base, prompt: params.prompt };
  }
  throw new Error("streamText requires either messages or prompt");
}

/**
 * Stream text tokens with Claude as primary (up to N attempts).
 * If Claude fails before any tokens are emitted, fall back to Gemini.
 * Mid-stream failures after tokens started are not retried (would corrupt output).
 */
export async function forEachResilientTextChunk(
  params: StreamParams,
  onChunk: (chunk: string) => void,
): Promise<{
  text: string;
  provider: LlmProviderId;
  claudeAttempts: number;
  errors: LlmAttemptError[];
}> {
  assertAnyLlmConfigured();

  const errors: LlmAttemptError[] = [];
  let claudeAttempts = 0;
  const callArgs = buildStreamArgs(params);

  if (isClaudeConfigured()) {
    const maxAttempts = getClaudeMaxAttempts();
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      claudeAttempts = attempt;
      let emitted = false;
      try {
        const result = streamText({
          model: getClaudeModel(),
          ...callArgs,
          maxRetries: 0,
        });

        let text = "";
        for await (const chunk of result.textStream) {
          emitted = true;
          text += chunk;
          onChunk(chunk);
        }

        return {
          text,
          provider: "claude",
          claudeAttempts,
          errors,
        };
      } catch (err) {
        const message = errMessage(err);
        errors.push({ provider: "claude", attempt, error: message });
        console.warn(
          `[llm] Claude attempt ${attempt}/${maxAttempts} failed: ${message}`,
        );

        if (emitted) {
          // Already streamed partial output — cannot safely switch providers.
          throw err;
        }

        if (attempt < maxAttempts) {
          await sleep(300 * attempt);
        }
      }
    }
  } else {
    errors.push({
      provider: "claude",
      attempt: 0,
      error: "ANTHROPIC_API_KEY is not configured",
    });
  }

  if (!isGeminiConfigured()) {
    throw new LlmProvidersExhaustedError(errors);
  }

  console.warn("[llm] Switching OFF Claude → Gemini fallback");

  try {
    const result = streamText({
      model: getGeminiModel(),
      ...callArgs,
      maxRetries: 1,
    });

    let text = "";
    for await (const chunk of result.textStream) {
      text += chunk;
      onChunk(chunk);
    }

    return {
      text,
      provider: "gemini",
      claudeAttempts,
      errors,
    };
  } catch (err) {
    errors.push({
      provider: "gemini",
      attempt: 1,
      error: errMessage(err),
    });
    throw new LlmProvidersExhaustedError(errors);
  }
}

/** Plain text stream for useCompletion (JD fit / company pitch). */
export function createResilientTextStreamResponse(
  params: StreamParams,
  options?: {
    headers?: HeadersInit;
    onFinish?: (meta: {
      text: string;
      provider: LlmProviderId;
      claudeAttempts: number;
      errors: LlmAttemptError[];
    }) => Promise<void> | void;
  },
): Response {
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        const meta = await forEachResilientTextChunk(params, (chunk) => {
          controller.enqueue(chunk);
        });
        await options?.onFinish?.(meta);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return createTextStreamResponse({
    headers: {
      "x-llm-primary": "claude",
      "x-llm-fallback": "gemini",
      ...Object.fromEntries(new Headers(options?.headers).entries()),
    },
    stream,
  });
}

/** UI message stream for useChat. */
export function createResilientUiMessageStreamResponse(
  params: StreamParams,
  options?: {
    headers?: HeadersInit;
    messageMetadata?: (part: {
      type: string;
    }) => Record<string, unknown> | undefined;
    onFinish?: (meta: {
      text: string;
      provider: LlmProviderId;
      claudeAttempts: number;
      errors: LlmAttemptError[];
    }) => Promise<void> | void;
  },
): Response {
  const textId = generateId();
  const messageId = generateId();

  const stream = createUIMessageStream<UIMessage>({
    execute: async ({ writer }) => {
      const startMeta = options?.messageMetadata?.({ type: "start" });
      writer.write({
        type: "start",
        messageId,
        ...(startMeta ? { messageMetadata: startMeta } : {}),
      });
      writer.write({ type: "text-start", id: textId });

      const meta = await forEachResilientTextChunk(params, (chunk) => {
        writer.write({ type: "text-delta", id: textId, delta: chunk });
      });

      writer.write({ type: "text-end", id: textId });
      const finishMeta = options?.messageMetadata?.({ type: "finish" });
      writer.write({
        type: "finish",
        ...(finishMeta ? { messageMetadata: finishMeta } : {}),
      });

      await options?.onFinish?.(meta);
    },
    onError: (error) => errMessage(error),
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      "x-llm-primary": "claude",
      "x-llm-fallback": "gemini",
      ...Object.fromEntries(new Headers(options?.headers).entries()),
    },
  });
}

export function llmErrorResponse(err: unknown): Response {
  if (err instanceof LlmProvidersExhaustedError) {
    return new Response(
      JSON.stringify({
        error: "All LLM providers failed",
        attempts: err.attempts,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({
      error: errMessage(err) || "LLM request failed",
    }),
    { status: 502, headers: { "Content-Type": "application/json" } },
  );
}
