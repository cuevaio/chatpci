import { env } from 'process';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const res = await fetch(`${env.R2R_API_URL}/v1/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
        model: 'openai/gpt-4o',
        temperature: 0.7,
      },
      include_title_if_available: true,
    }),
  });

  if (!res.body) {
    throw new Error('Response body is null');
  }

  const transformStream = new TransformStream<Uint8Array, string>({
    transform: createChunkTransformer(),
  });

  return new Response(res.body.pipeThrough(transformStream), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

function createChunkTransformer() {
  let storedChunk = '';
  let streamedArguments = false;
  let streamedResults = false;

  return function transform(chunk: Uint8Array, controller: TransformStreamDefaultController<string>) {
    const decoder = new TextDecoder();
    const decoded = decoder.decode(chunk);
    storedChunk += decoded;

    const parsedChunk = parseChunk();
    if (parsedChunk) {
      controller.enqueue(parsedChunk);
    }
  };

  function parseChunk(): string | null {
    if (!streamedArguments) {
      const argumentsMatch = storedChunk.match(/<arguments>(.*?)<\/arguments>/);
      if (argumentsMatch) {
        storedChunk = storedChunk.replace(argumentsMatch[0], '');
        streamedArguments = true;
        return `2:[${argumentsMatch[1]}]\n`;
      }
    }

    if (!streamedResults) {
      const resultsMatch = storedChunk.match(/<results>(.*?)<\/results>/);
      if (resultsMatch) {
        const data = [{
          results: JSON.parse(`[${resultsMatch[1]}]`).map((x: string) => JSON.parse(x)),
        }];
        storedChunk = storedChunk.replace(resultsMatch[0], '');
        streamedResults = true;
        return `2:${JSON.stringify(data)}\n`;
      }
    }

    if (storedChunk.includes('<completion>')) {
      const completionMatch = storedChunk.match(/<completion>(.*?)<\/completion>/s);
      if (completionMatch) {
        const result = completionMatch[1]
          .replace(/(?<=^"|[^"])("?)(?!")(?=.*"$)/g, '\\"')
          .replace(/\n/g, '\\n');
        storedChunk = storedChunk.replace(completionMatch[0], '');
        return result.length > 0 ? `0:"${result}"\n` : null;
      }
    }

    return null;
  }
}