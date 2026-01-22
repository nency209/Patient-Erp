import Bunch from '../models/Bunch.js';

// GET ALL BUNCHES
export const getBunches = async (req, res) => {
  try {
    const bunches = await Bunch.find()
      .populate('medicineIds')
      .sort({ createdAt: -1 });
    res.status(200).json(bunches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE BUNCH (POST)
export const createBunch = async (req, res) => {
  const { name, selectedMedicineIds } = req.body;
  try {
    const newBunch = new Bunch({ 
      name, 
      medicineIds: selectedMedicineIds 
    });
    const saved = await newBunch.save();
    const populated = await Bunch.findById(saved._id).populate('medicineIds');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// UPDATE BUNCH (PUT)
export const updateBunch = async (req, res) => {
  const { id } = req.params;
  const { name, selectedMedicineIds } = req.body;
  try {
    // Ensure we only save raw IDs to prevent CastErrors
    const cleanIds = selectedMedicineIds.map(med => typeof med === 'object' ? med._id : med);

    const updated = await Bunch.findByIdAndUpdate(
      id,
      { name, medicineIds: cleanIds },
      { new: true }
    ).populate('medicineIds');

    if (!updated) return res.status(404).json({ message: "Bunch not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE BUNCH
export const deleteBunch = async (req, res) => {
  try {
    await Bunch.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};