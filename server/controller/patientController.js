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
        const { id } = req.params;
        const { date, notes, previousAppointment, medicines, overallSuggestion } = req.body;

        // Ensure the mandatory field is present before attempting to save
        if (!previousAppointment) {
            return res.status(400).json({ message: "Previous Appointment date is required." });
        }

        // Use findByIdAndUpdate with runValidators: true to catch schema issues
        const updatedPatient = await Patient.findByIdAndUpdate(
            id,
            {
                $push: {
                    followUps: {
                        date,
                        notes,
                        previousAppointment,
                        medicines,
                        overallSuggestion
                    }
                }
            },
            { new: true, runValidators: true } // Ensures the schema check happens
        );

        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        res.status(200).json(updatedPatient);
    } catch (error) {
        console.error("Backend Save Error:", error.message);
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

// UPDATE FOLLOW-UP
// Inside controller/patientController.js

export const updateFollowUp = async (req, res) => {
  try {
    const { id, followUpId } = req.params;
    const { notes, previousAppointment, medicines, overallSuggestion, date } = req.body;

    // Use $[elem] positional operator to update the specific follow-up in the array
    const updatedPatient = await Patient.findOneAndUpdate(
      { _id: id, "followUps._id": followUpId },
      {
        $set: {
          "followUps.$[elem].notes": notes,
          "followUps.$[elem].previousAppointment": previousAppointment,
          "followUps.$[elem].medicines": medicines,
          "followUps.$[elem].overallSuggestion": overallSuggestion,
          "followUps.$[elem].date": date
        }
      },
      {
        arrayFilters: [{ "elem._id": followUpId }],
        new: true,
        runValidators: true
      }
    );

    if (!updatedPatient) return res.status(404).json({ message: "Patient or Visit not found" });
    res.status(200).json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export default { createPatient, getPatients, getPatientById, updatePatient, deletePatient,addFollowUp,updateFollowUp, deleteFollowUp};