import { Schema, model } from "mongoose";

const voteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, required: true },
  value: { type: Number, required: true },
  subject: { type: String, required: true },
  examType: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date().toISOString() }, // funzione per default dinamico
});

const Vote = model("Vote", voteSchema);
export default Vote;
