import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    problems: mongoose.Types.ObjectId[];
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    participants: mongoose.Types.ObjectId[];
}

const ContestSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    problems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

export default mongoose.model<IContest>('Contest', ContestSchema);
