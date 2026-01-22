import express from "express";
import medicineController from "../controller/medicineController.js";

const router = express.Router();

router.post("/", medicineController.createMedicine);
router.get("/", medicineController.getAllMedicines);
router.put("/:id", medicineController.updateMedicine);
router.delete("/:id", medicineController.deleteMedicine);

export default router;
