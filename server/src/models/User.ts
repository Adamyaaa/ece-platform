import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  profilePicture: string;
  solvedProblems: mongoose.Types.ObjectId[];
  firebaseUid?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  firebaseUid: { type: String, unique: true, sparse: true }
});

export default mongoose.model<IUser>('User', UserSchema);