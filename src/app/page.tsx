"use client";

import { ChatMessage } from "@/components/chat-message";
import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "ai/react";
import * as React from "react";
import Markdown from "react-markdown";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, data } = useChat({
    api: "/api/chatr",
  });

  const [docs, chunks] = React.useMemo(() => {
    const docs = new Map<string, { id: string; title: string }>();
    const chunks = new Map<
      string,
      { id: string; document_id: string; text: string }
    >();

    data?.forEach((x) => {
      if (x && typeof x === "object" && !Array.isArray(x)) {
        if (x["results"] && Array.isArray(x["results"])) {
          (
            x["results"] as {
              id: string;
              metadata: {
                associatedQuery: string;
                document_id: string;
                extraction_id: string;
                text: string;
                title: string;
                user_id: string;
              };
              score: number;
            }[]
          ).forEach((x) => {
            if (!docs.has(x.metadata.document_id)) {
              docs.set(x.metadata.document_id, {
                id: x.metadata.document_id,
                title: x.metadata.title,
              });
            }

            if (!docs.has(x.id)) {
              chunks.set(x.id, {
                id: x.id,
                document_id: x.metadata.document_id,
                text: x.metadata.text,
              });
            }
          });
        }
      }
    });

    return [Array.from(docs.values()), Array.from(chunks.values())];
  }, [data]);

  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      <ThemeToggle />
      <div className="space-y-4">
        {data && <pre>{JSON.stringify(docs, undefined, 2)}</pre>}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl bg-transparent"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
