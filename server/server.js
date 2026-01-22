import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import Routes
import medicineRoutes from "./routes/medicineRoutes.js";
import bunchRoutes from './routes/bunchRoutes.js';
import patientRoutes from './routes/patientRoutes.js'
import connectDB from "./utils/db.js";

dotenv.config();

const app = express();



// app.use(cors())

app.use(cors({
  origin: 'https://patient-erp.vercel.app', 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] // Explicitly allow all methods
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ⛔ IMPORTANT: Connect DB BEFORE using routes
await connectDB();

// Routes
app.use("/api/medicines", medicineRoutes);
app.use("/api/bunches",bunchRoutes);
app.use("/api/patients",patientRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
