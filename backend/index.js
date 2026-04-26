import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./middleware/database.js";
import userRoutes from "./routes/userRoutes.js";
import rfqRoutes from "./routes/rfqRoutes.js";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();
// Reload trigger for .env changes

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // Integrates Clerk auth across all Express handlers

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rfqs", rfqRoutes);

// Error Handling (fallback for 404)
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});