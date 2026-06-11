import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  summary: string;
  url: string;
  source: string;
  tags: string[];
  addedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true, trim: true },
  summary: { type: String, default: '' },
  url: { type: String, required: true },
  source: { type: String, required: true },
  tags: { type: [String], default: [] },
  addedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IArticle>('Article', ArticleSchema);
