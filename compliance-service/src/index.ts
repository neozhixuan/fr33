import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import vcRoutes from "./routes/vc.routes";
import { initConfig } from "./config/config";

const app = express();

app.use(express.json());
app.use(cors());

// Register routes
app.use(vcRoutes);

const PORT = process.env.PORT || 3001;

// Initialize server
const startServer = async () => {
  try {
    initConfig();
    app.listen(PORT, () => {
      console.log(`-- Express server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("-- Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("-- Shutting down gracefully...");

  try {
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start the server
startServer();

export default app;
