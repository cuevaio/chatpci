import { convertToCoreMessages, StreamData, streamText } from "ai";
import { createOpenAI as createGroq } from "@ai-sdk/openai";

const groq = createGroq({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST() {
  const messages: any = [
    { id: "1", role: "user", content: 'What are the charge codes in "ERCOT"' },
  ];

  const data = new StreamData();

  data.append({ hello: "world" });

  const result = await streamText({
    model: groq("llama-3.1-70b-versatile"),
    system: "You are a helpful assistant.",
    messages: convertToCoreMessages(messages),
    onFinish() {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}
