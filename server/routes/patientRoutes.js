import express from "express";
import { 
  createPatient, 
  getPatients, 
  getPatientById, 
  updatePatient, // Add this
  deletePatient ,
  addFollowUp,
  deleteFollowUp ,
  updateFollowUp// Add this
} from "../controller/patientController.js";

const router = express.Router();

router.post("/", createPatient);
router.get("/", getPatients);
router.get("/:id", getPatientById);
router.put("/:id", updatePatient);    // Add this line
router.delete("/:id", deletePatient); // Add this line
router.post("/:id/followups", addFollowUp);
router.put('/:patientId/followups/:followUpId', updateFollowUp);
router.delete("/:id/followups/:followUpId", deleteFollowUp);

export default router;