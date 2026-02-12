import mongoose, { Schema, Document } from 'mongoose';

export interface IProblem extends Document {
  title: string;
  difficulty: string;
  category: string;
  description: string;
  templateCode: string;
  testbench: string; // <--- ADD THIS LINE
}

const ProblemSchema: Schema = new Schema({
  title: { type: String, required: true },
  difficulty: { type: String, required: true },
  category: { type: String, required: false, default: "Hardware" }, // Made optional with default
  description: { type: String, required: true },
  templateCode: { type: String, required: true },
  testbench: { type: String, required: true } // <--- AND THIS LINE
});

export default mongoose.model<IProblem>('Problem', ProblemSchema);