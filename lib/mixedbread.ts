import Mixedbread from "@mixedbread/sdk";

let client: Mixedbread | null = null;

// Created on first use, so `next build` runs without the key
export function getMixedbreadClient(): Mixedbread {
  const apiKey = process.env.MXBAI_API_KEY;
  if (!apiKey) {
    throw new Error("MXBAI_API_KEY is not configured");
  }

  client ??= new Mixedbread({
    apiKey,
    defaultHeaders: { "Accept-Encoding": "gzip" },
  });

  return client;
}
