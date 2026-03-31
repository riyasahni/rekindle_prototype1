import OpenAI from "openai";

const model = "text-embedding-3-small";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  const openai = new OpenAI({ apiKey: key });
  const res = await openai.embeddings.create({
    model,
    input: texts,
  });
  const byIndex = [...res.data].sort((a, b) => a.index - b.index);
  return byIndex.map((d) => d.embedding as number[]);
}
