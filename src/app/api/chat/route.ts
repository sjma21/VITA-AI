import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { loadProfile } from "@/lib/profile";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { buildSystemPrompt, lastUserText } from "@/lib/llm/system-prompt";
import { prisma } from "@/lib/db";
import { createId } from "@/lib/id";
import { requireEnv } from "@/lib/env";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    requireEnv("ANTHROPIC_API_KEY");
  } catch {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    conversationId?: string;
  };

  const messages = body.messages ?? [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const query = lastUserText(messages);
  if (!query) {
    return new Response(JSON.stringify({ error: "empty user message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profile = loadProfile();
  const evidence = await retrieveRelevantChunks(query, { topK: 8 });

  let conversationId = body.conversationId;
  if (!conversationId) {
    conversationId = createId();
    await prisma.conversation.create({
      data: { id: conversationId },
    });
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: query,
    },
  });

  await prisma.event.create({
    data: {
      conversationId,
      type: "chat_question",
      payload: {
        query,
        citations: evidence.map((e) => ({
          source: e.source,
          sourceRef: e.sourceRef,
          score: e.score,
        })),
      },
    },
  });

  const modelId = process.env.CHAT_MODEL?.trim() || "claude-sonnet-4-5";
  const system = buildSystemPrompt(profile, evidence);

  const result = streamText({
    model: anthropic(modelId),
    system,
    messages: await convertToModelMessages(messages),
    temperature: 0.2,
    onFinish: async ({ text }) => {
      try {
        await prisma.message.create({
          data: {
            conversationId: conversationId!,
            role: "assistant",
            content: text,
            citations: evidence.map((e) => ({
              source: e.source,
              sourceRef: e.sourceRef,
              score: e.score,
            })),
          },
        });
      } catch (err) {
        console.error("failed to persist assistant message", err);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-conversation-id": conversationId,
    },
    messageMetadata: ({ part }) => {
      if (part.type === "start" || part.type === "finish") {
        return {
          citations: evidence.map((e) => ({
            source: e.source,
            sourceRef: e.sourceRef,
            score: Number(e.score.toFixed(3)),
          })),
        };
      }
      return undefined;
    },
  });
}
