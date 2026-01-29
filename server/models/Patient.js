import mongoose from "mongoose";

const MedicineItemSchema = new mongoose.Schema({
  name: { type: String },
  reason: { type: String },
  showReason: { type: Boolean, default: false }
});

const MedicineGroupSchema = new mongoose.Schema({
  id: { type: String },
  mainCategory: { type: String },
  subMedicines: [MedicineItemSchema], 
  timings: {
    am: { type: String },
    pm: { type: String },
    freq: { type: String } // Added this based on your frontend payload
  },
  bottleNumber: { type: Number, enum: [1, 2, 3] },
  suggestion: { type: String },
  showSuggestion: { type: Boolean, default: false }
});

// Define the follow-up visit schema
const FollowUpSchema = new mongoose.Schema({
  date: { type: String, required: true },
  notes: { type: String }, 
  
  // ✅ FIXED: Added these fields so they can be saved
  pastHistory: { type: String },
  visitObservation: { type: String },
  
  previousAppointment: { type: String }, 
  medicines: [MedicineGroupSchema],
  overallSuggestion: { type: String },
});

const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    weight: { type: String },
    height: { type: String },
    address: { type: String },
    birthDate: { type: String },
    education: { type: String },
    pMainDate: { 
      type: String, 
      required: true, 
      default: () => new Date().toISOString().split('T')[0] 
    },
    maritalStatus: { type: String, default: "Unmarried" },
    work: { type: String },
    husbandName: { type: String },
    husbandAge: { type: Number },
    hasChildren: { type: Boolean, default: false },
    childName: { type: String },
    childAge: { type: Number },
    childStudy: { type: String },
    healthConcerns: {
      main: { type: String, required: true },
      physical: { type: String },
      emotional: { type: String },
      pastHistory: { type: String },
      additional: [String]
    },
    medicines: [MedicineGroupSchema], 
    followUps: [FollowUpSchema],      
    overallSuggestion: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Patient", PatientSchema);