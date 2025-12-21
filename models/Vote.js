import { Schema, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const voteSchema = new Schema({
  logicalId: { type: String, default: uuidv4, index: true, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, required: true },
  value: { type: Number, required: true },
  subject: { type: String, required: true },
  examType: { type: String, required: true },
  createdAt: {
    type: Date,
    default: () => new Date().toISOString(),
    required: true,
  }, // funzione per default dinamico
});

const Vote = model("Vote", voteSchema);
export default Vote;
