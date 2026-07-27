import axios from 'axios';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || '';
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || 'voyage-3.5-lite';
// Pinned explicitly (rather than relying on the model's default) so this
// number can be reused verbatim as `numDimensions` in setupVectorIndex.ts —
// keeping the embed call and the Atlas index definition from drifting apart.
export const VOYAGE_DIMENSIONS = Number(process.env.VOYAGE_DIMENSIONS) || 1024;

// Embeds a single string of text. Returns null (never throws) if the API key
// is missing or the call fails, so callers can no-op gracefully instead of
// taking down whatever request triggered the embed.
export async function embedText(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null;

  try {
    const response = await axios.post(
      VOYAGE_API_URL,
      { input: [text], model: VOYAGE_MODEL, input_type: 'document', output_dimension: VOYAGE_DIMENSIONS },
      {
        headers: { Authorization: `Bearer ${VOYAGE_API_KEY}` },
        timeout: 15000,
      }
    );
    return response.data?.data?.[0]?.embedding || null;
  } catch (err: any) {
    console.warn('⚠️ Voyage embedding failed:', err.message);
    return null;
  }
}

// Same as embedText, but tagged as a search query rather than a document —
// Voyage recommends this for asymmetric retrieval (query vs. indexed content).
export async function embedQuery(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null;

  try {
    const response = await axios.post(
      VOYAGE_API_URL,
      { input: [text], model: VOYAGE_MODEL, input_type: 'query', output_dimension: VOYAGE_DIMENSIONS },
      {
        headers: { Authorization: `Bearer ${VOYAGE_API_KEY}` },
        timeout: 15000,
      }
    );
    return response.data?.data?.[0]?.embedding || null;
  } catch (err: any) {
    console.warn('⚠️ Voyage query embedding failed:', err.message);
    return null;
  }
}
