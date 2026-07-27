import mongoose from 'mongoose';
import EmbeddingChunk, { EmbeddingSourceType } from '../models/EmbeddingChunk';
import { embedText, embedQuery } from './embeddings';

export interface RetrievedChunk {
  sourceType: EmbeddingSourceType;
  title: string;
  text: string;
}

// Embeds and upserts a single chunk. Fire-and-forget from callers — logs and
// returns silently on failure so a broken embed never breaks the request
// that triggered it (e.g. creating a blog post).
export async function upsertChunk(
  sourceType: EmbeddingSourceType,
  sourceId: string,
  title: string,
  text: string
): Promise<void> {
  try {
    const embedding = await embedText(`${title}\n\n${text}`);
    if (!embedding) return;

    await EmbeddingChunk.findOneAndUpdate(
      { sourceType, sourceId },
      { sourceType, sourceId, title, text, embedding, updatedAt: new Date() },
      { upsert: true }
    );
  } catch (err: any) {
    console.warn(`⚠️ Failed to index ${sourceType} ${sourceId}:`, err.message);
  }
}

export async function deleteChunk(sourceType: EmbeddingSourceType, sourceId: string): Promise<void> {
  try {
    await EmbeddingChunk.deleteOne({ sourceType, sourceId });
  } catch (err: any) {
    console.warn(`⚠️ Failed to remove index entry for ${sourceType} ${sourceId}:`, err.message);
  }
}

// Vector search over indexed content. Returns [] on any failure (missing
// API key, index not built yet, Atlas tier doesn't support vector search,
// etc.) so /api/chat degrades to "no retrieved context" instead of erroring.
export async function retrieveContext(query: string, topK = 5): Promise<RetrievedChunk[]> {
  try {
    const queryEmbedding = await embedQuery(query);
    if (!queryEmbedding) return [];

    const collection = mongoose.connection.collection('embeddingchunks');
    const results = await collection
      .aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: topK * 20,
            limit: topK,
          },
        },
        { $project: { sourceType: 1, title: 1, text: 1, _id: 0 } },
      ])
      .toArray();

    return results as unknown as RetrievedChunk[];
  } catch (err: any) {
    console.warn('⚠️ Vector search failed, continuing without retrieved context:', err.message);
    return [];
  }
}
