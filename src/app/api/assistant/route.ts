import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { buildSystemPrompt, buildTabSnapshot, resolveTab } from "@/lib/assistant/context";
import { buildAssistantTools } from "@/lib/assistant/tools";

// Prisma needs the Node runtime, and a tool loop that drafts replies for
// several guests can outrun the default serverless window.
export const runtime = "nodejs";
export const maxDuration = 60;

// Same model the autopilot generators use, so the copy the assistant
// writes and the copy the autopilots write come from the same voice.
const MODEL = "gpt-4o";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "The assistant needs OPENAI_API_KEY set in .env before it can answer.",
      { status: 503 }
    );
  }

  const { messages, pathname } = (await req.json()) as {
    messages: UIMessage[];
    pathname?: string;
  };

  const user = await getOrCreateUserAndBusiness(
    session.user.sub,
    session.user.email,
    session.user.name
  );
  const business = user.business;

  // Tab-awareness resolves here rather than in the browser: the snapshot is
  // read from the database on every message, so the assistant is never
  // describing a guest list the owner has already changed.
  const tab = resolveTab(pathname);
  const snapshot = await buildTabSnapshot(business.id, tab);

  const result = streamText({
    model: openai(MODEL),
    system: buildSystemPrompt(business, tab, snapshot),
    messages: await convertToModelMessages(messages),
    tools: buildAssistantTools(business),
    // Enough room to look something up, act on it, and report back,
    // without letting a confused loop run away.
    stopWhen: stepCountIs(8),
    temperature: 0.6,
  });

  return result.toUIMessageStreamResponse();
}
