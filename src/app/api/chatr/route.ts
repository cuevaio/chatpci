export async function POST(req: Request) {
  const { messages } = await req.json();

  const res = await fetch(
    "https://sciphi-6db55e6d-12a5-4cd8-a930-a7e4f4390f6e-qwpin2swwa-ue.a.run.app/v1/agent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        vector_search_settings: {
          use_vector_search: true,
          search_filters: {},
          search_limit: 10,
          do_hybrid_search: true,
        },
        kg_search_settings: {
          use_kg_search: true,
        },
        rag_generation_config: {
          stream: true,
          model: "openai/gpt-4o",
          temperature: 0.7,
        },
        include_title_if_available: true,
      }),
    }
  );

  let storedChunk = "";

  let streamedArguments = false;
  let streamedResults = false;

  function parseChunk(chunk: Uint8Array) {
    const decoder = new TextDecoder();
    const decoded = decoder.decode(chunk);

    storedChunk += decoded;

    if (!streamedArguments) {
      // Check for <arguments>
      const argumentsMatch = storedChunk.match(/<arguments>(.*?)<\/arguments>/);
      if (argumentsMatch) {
        const result = `2:[${argumentsMatch[1]}]\n`;
        storedChunk = storedChunk.replace(argumentsMatch[0], "");
        streamedArguments = true;
        return result;
      }
    }

    if (!streamedResults) {
      // Check for <results>
      const resultsMatch = storedChunk.match(/<results>(.*?)<\/results>/);

      if (resultsMatch) {
        const data = [
          {
            results: JSON.parse(`[${resultsMatch[1]}]`).map((x: string) =>
              JSON.parse(x)
            ),
          },
        ];

        const result = `2:${JSON.stringify(data)}\n`;
        storedChunk = storedChunk.replace(resultsMatch[0], "");
        return result;
      }
    }

    if (storedChunk.includes("<completion>")) {
      const result = decoded
        .replace(/(?<=^"|[^"])("?)(?!")(?=.*"$)/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace("<completion>", "")
        .replace("</completion>", "");

      if (result.length > 0) {
        return `0:"${result}"\n`;
      }
    } else {
      return null;
    }
  }

  const transformStream = new TransformStream<Uint8Array>({
    transform(chunk, controller) {
      const decoded = parseChunk(chunk);
      decoded && controller.enqueue(decoded);
    },
  });

  return new Response(res.body!.pipeThrough(transformStream), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
