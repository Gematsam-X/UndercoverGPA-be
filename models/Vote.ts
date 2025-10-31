import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, required: true },
  value: { type: Number, required: true },
  subject: {type: String, required: true},
  examType: {type: String, required: true},
  createdAt: { type: Date, default: new Date().toISOString() },
});

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
