import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  solvedProblems: mongoose.Types.ObjectId[]; // <--- ADD THIS
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }] // <--- AND THIS
});

export default mongoose.model<IUser>('User', UserSchema);