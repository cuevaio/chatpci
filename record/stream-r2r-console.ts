import { r2rClient } from "r2r-js";

(async () => {
  const client = new r2rClient(
    "https://sciphi-6db55e6d-12a5-4cd8-a930-a7e4f4390f6e-qwpin2swwa-ue.a.run.app"
  );

  const messages = [
    { role: "user", content: "What are the charge codes in ERCOT?" },
  ];

  const agentResponse = await client.agent({
    messages,
    use_vector_search: true,
    do_hybrid_search: true,
    rag_generation_config: { stream: true },
  });

  if (agentResponse instanceof ReadableStream) {
    const reader = agentResponse.getReader();
    while (true) {
      const { done, value } = await reader.read();
      console.log(value);
      if (done) break;
      console.log(new TextDecoder().decode(value));
    }
  }
})();
