import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    oneLiner: { type: String, required: true }, // frontend match
    shortDescription: { type: String },
    longDescription: { type: String },
    images: [String] // base64 or URLs
  },
  { timestamps: true }
);

// Ensure frontend receives `id` instead of `_id`
MedicineSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

export default mongoose.model("Medicine", MedicineSchema);
