import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  content: string;
  summary: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  tags: string[];
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, default: '' },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, default: '' },
    tags: { type: [String], default: [] },
    likes: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IBlog>('Blog', BlogSchema);
