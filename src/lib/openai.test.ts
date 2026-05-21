import { describe, expect, it } from "vitest";
import { createOpenAiDraft } from "./openai";

describe("OpenAI draft client", () => {
  it("fails clearly when the API key is missing", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(createOpenAiDraft("Hello")).rejects.toThrow("OPENAI_API_KEY");

    process.env.OPENAI_API_KEY = original;
  });
});
