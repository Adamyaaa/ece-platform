import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
    problemId: mongoose.Types.ObjectId;
    userId: string;
    username: string;
    text: string;
    likes: string[]; // Array of userIds who liked
    parentId: mongoose.Types.ObjectId | null;
    createdAt: Date;
}

const CommentSchema: Schema = new Schema({
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    text: { type: String, required: true },
    likes: [{ type: String }],
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
}, {
    timestamps: true
});

export default mongoose.model<IComment>('Comment', CommentSchema);
