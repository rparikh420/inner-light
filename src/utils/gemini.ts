const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiNotConfiguredError extends Error {
  constructor() {
    super('Add a Gemini API key (EXPO_PUBLIC_GEMINI_API_KEY) to your .env file to enable pattern analysis. Get a free key at aistudio.google.com/apikey.');
    this.name = 'GeminiNotConfiguredError';
  }
}

export function isGeminiConfigured(): boolean {
  return !!API_KEY;
}

/**
 * Sends a prompt to Gemini 2.5 Flash and parses its response as JSON,
 * constrained to the given OpenAPI-subset schema via responseSchema —
 * this is what lets us treat the model as a structured extraction step
 * rather than a free-text chat partner.
 */
export async function generateStructured<T>(prompt: string, responseSchema: object): Promise<T> {
  if (!API_KEY) throw new GeminiNotConfiguredError();

  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(text) as T;
}
