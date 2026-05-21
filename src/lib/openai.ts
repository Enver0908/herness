type ResponsePayload = {
  output_text?: string;
  output?: {
    content?: {
      text?: string;
      type?: string;
    }[];
    type?: string;
  }[];
};

export async function createOpenAiDraft(input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate AI drafts.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input,
      model,
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const payload = (await response.json()) as ResponsePayload;
  const text =
    payload.output_text?.trim() ??
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text" && content.text)
      ?.text?.trim();

  if (!text) {
    throw new Error("OpenAI response did not include output_text.");
  }

  return { model, text };
}
