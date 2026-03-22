import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import vcRoutes from "./routes/vc.routes";
import complianceRoutes from "./routes/compliance.routes";
import { initConfig } from "./config/config";
import {
  startComplianceMonitor,
  stopComplianceMonitor,
} from "./services/compliance/monitor.service";

const app = express();

app.use(express.json());
app.use(cors());

// Register routes
app.use(vcRoutes);
app.use(complianceRoutes);

const PORT = process.env.PORT || 3001;

// Initialize server
const startServer = async () => {
  try {
    initConfig();
    app.listen(PORT, () => {
      console.log(`-- Express server running on port ${PORT}`);
    });
    startComplianceMonitor();
  } catch (error) {
    console.log("-- Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("-- Shutting down gracefully...");

  try {
    stopComplianceMonitor();
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
