import Patient from "../models/Patient.js";

// CREATE NEW CASE
export const createPatient = async (req, res) => {
  try {
    const patient = new Patient(req.body);
    const savedPatient = await patient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    console.error("Error creating patient:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// GET ALL CASES
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// GET SINGLE CASE
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPatient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json(updatedPatient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE PATIENT (Added for History Module)
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json({ message: "Patient record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// controller/patientController.js


export const addFollowUp = async (req, res) => {
  try {
    const { 
      date, 
      notes, 
      medicines, 
      previousAppointment, 
      overallSuggestion,
      // Add these two:
      pastHistory, 
      visitObservation 
    } = req.body;

    const patient = await Patient.findById(req.params.id);

    patient.followUps.push({
      date,
      notes,
      medicines,
      previousAppointment,
      overallSuggestion,
      pastHistory,       // ✅ Pass it to the array
      visitObservation   // ✅ Pass it to the array
    });

    await patient.save();
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE FOLLOW-UP
export const deleteFollowUp = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Filter out the specific follow-up by its unique ID
    patient.followUps = patient.followUps.filter(f => f._id.toString() !== req.params.followUpId);
    await patient.save();
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// controllers/patientController.js

export const updateFollowUp = async (req, res) => {
  try {
    // 1. Debugging: Log the IDs to ensure they are being received
    console.log("Patient ID:", req.params.patientId);
    console.log("FollowUp ID:", req.params.followUpId);
    console.log("Body:", req.body);

    const { patientId, followUpId } = req.params;
    
    // 2. Extract ALL fields from the request body, INCLUDING pastHistory
    const { 
      date, 
      notes, 
      medicines, 
      previousAppointment, 
      overallSuggestion,
      pastHistory,       // <--- CRITICAL: Extract this
      visitObservation   // <--- CRITICAL: Extract this
    } = req.body;

    // 3. Find the patient document
    const patient = await Patient.findById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found in database" });
    }

    // 4. Find the specific follow-up subdocument
    const followUp = patient.followUps.id(followUpId);
    
    if (!followUp) {
      return res.status(404).json({ message: "Follow-up record not found" });
    }

    // 5. Explicitly update the fields
    followUp.date = date;
    followUp.notes = notes;
    followUp.medicines = medicines;
    followUp.previousAppointment = previousAppointment;
    followUp.overallSuggestion = overallSuggestion;
    
    // 6. Only update these if they exist in the payload
    if (pastHistory !== undefined) followUp.pastHistory = pastHistory;
    if (visitObservation !== undefined) followUp.visitObservation = visitObservation;

    // 7. Save the parent document
    await patient.save();

    res.status(200).json(patient);
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: error.message });
  }
};
export default { createPatient, getPatients, getPatientById, updatePatient, deletePatient,addFollowUp,updateFollowUp, deleteFollowUp};