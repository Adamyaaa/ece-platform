import mongoose, { Schema, Document } from 'mongoose';

export interface IContestParticipant extends Document {
    contestId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    username: string;
    score: number;
    finishTime?: Date;
    problemStatus: Map<string, {
        solved: boolean;
        attempts: number;
        solvedAt?: Date;
    }>;
}

const ContestParticipantSchema: Schema = new Schema({
    contestId: { type: Schema.Types.ObjectId, ref: 'Contest', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    score: { type: Number, default: 0 },
    finishTime: { type: Date },
    problemStatus: {
        type: Map,
        of: new Schema({
            solved: { type: Boolean, default: false },
            attempts: { type: Number, default: 0 },
            solvedAt: { type: Date }
        }, { _id: false }),
        default: {}
    }
});

// Compound index to ensure a user only registers once per contest
ContestParticipantSchema.index({ contestId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IContestParticipant>('ContestParticipant', ContestParticipantSchema);
