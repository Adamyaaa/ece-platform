import mongoose, { Schema, Document } from 'mongoose';

export type EmbeddingSourceType = 'problem' | 'blog' | 'article';

export interface IEmbeddingChunk extends Document {
  sourceType: EmbeddingSourceType;
  sourceId: string;
  title: string;
  text: string;
  embedding: number[];
  updatedAt: Date;
}

const EmbeddingChunkSchema = new Schema<IEmbeddingChunk>({
  sourceType: { type: String, required: true, enum: ['problem', 'blog', 'article'] },
  sourceId: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  updatedAt: { type: Date, default: Date.now },
});

EmbeddingChunkSchema.index({ sourceType: 1, sourceId: 1 }, { unique: true });

export default mongoose.model<IEmbeddingChunk>('EmbeddingChunk', EmbeddingChunkSchema);
