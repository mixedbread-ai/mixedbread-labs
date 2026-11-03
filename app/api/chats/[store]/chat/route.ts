import { createUIMessageStreamResponse, isStepCount, ToolLoopAgent } from "ai";
import { z } from "zod";
import { badRequest, rejectBots } from "@/lib/api";
import { CHAT_MODEL, CITATION_HREF, type DocChatMessage } from "@/lib/chat";
import type { Passage } from "@/lib/passages";
import { blockCitations, toolCallsAsData } from "./stream";
import { storeTools } from "./tools";

// Each search runs Toast's own loop, several seconds, and a question may take a few
export const maxDuration = 120;

const INSTRUCTIONS = `You answer questions about the documents a visitor uploaded to this chat. Use the search tool to find evidence in them before you answer, and search again for any part of the question the results do not cover.

Answer only from the evidence, and say so when the documents do not cover the question. Lead with the answer and keep it short. Quote figures exactly as written. Use a Markdown table to compare several figures.

Each search result is a passage: a chunk_id, its file, and either its page's layout elements, each with an index e, or its text. Cite sources using the format <cite i="..." e="..."/> whenever you use information from them: i is the result's chunk_id and e the index of the element the information is in. Use a single element per citation; when a statement draws on several elements, emit one citation per element, placed next to the statement it supports. Cite a passage without elements as <cite i="..."/>. Cite only results the search returned.`;

const MAX_STEPS = 8;
const HISTORY_LIMIT = 8;
const MAX_QUESTION_LENGTH = 1000;
// Room for a full answer; the client sends the history, so a forged one is
// cut here rather than billed as input
const MAX_MESSAGE_LENGTH = 20_000;
const CITATIONS = new RegExp(
  String.raw`\[\d+\]\(${CITATION_HREF}[\w.]+\)`,
  "g"
);

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        parts: z.array(
          z.object({ type: z.string(), text: z.string().optional() })
        ),
      })
    )
    .min(1),
});

/**
 * The conversation as model input: text only, citations dropped, as each run
 * starts from no pages read
 */
function toInput(messages: z.infer<typeof BodySchema>["messages"]) {
  const input: { role: "user" | "assistant"; content: string }[] = [];
  for (const message of messages.slice(-HISTORY_LIMIT)) {
    const texts: string[] = [];
    for (const part of message.parts) {
      if (part.type === "text" && part.text) texts.push(part.text);
    }
    const content = texts
      .join("\n\n")
      .replace(CITATIONS, "")
      .trim()
      .slice(0, MAX_MESSAGE_LENGTH);
    if (content) input.push({ role: message.role, content });
  }
  return input;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ store: string }> }
) {
  const rejected = await rejectBots();
  if (rejected) return rejected;

  const { store } = await params;
  const body = BodySchema.safeParse(await req.json());
  const input = body.success ? toInput(body.data.messages) : [];
  const question = input.at(-1);
  if (
    !z.uuid().safeParse(store).success ||
    question?.role !== "user" ||
    question.content.length > MAX_QUESTION_LENGTH
  ) {
    return badRequest("Invalid question.");
  }

  const asked = Date.now();
  // Every passage the run's tools return, which its citations resolve against
  const shown = new Map<string, Passage>();
  const agent = new ToolLoopAgent({
    model: CHAT_MODEL,
    instructions: `${INSTRUCTIONS}\n\nToday's date is ${new Date().toISOString().slice(0, 10)} (UTC).`,
    tools: storeTools(store, shown),
    stopWhen: isStepCount(MAX_STEPS),
    reasoning: "low",
    maxOutputTokens: 4000,
  });
  const result = await agent.stream({
    messages: input,
    abortSignal: req.signal,
  });

  const stream = result
    .toUIMessageStream<DocChatMessage>({
      sendReasoning: false,
      onError: (error) => {
        console.error("Chat failed", error);
        return "The answer failed. Try again.";
      },
    })
    .pipeThrough(toolCallsAsData(asked))
    .pipeThrough(blockCitations(store, shown));

  return createUIMessageStreamResponse({ stream });
}
