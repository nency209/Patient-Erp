import Medicine from "../models/Medicine.js";

// CREATE
const createMedicine = async (req, res) => {
  try {
    console.log("Received data:", req.body);

    const medicine = new Medicine(req.body);
    await medicine.save();

    res.status(201).json(medicine);
  } catch (error) {
    console.error("Validation Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// READ ALL
const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE
const updateMedicine = async (req, res) => {
  try {
    const updated = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE
const deleteMedicine = async (req, res) => {
  try {
    const deleted = await Medicine.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  createMedicine,
  getAllMedicines,
  updateMedicine,
  deleteMedicine
};
