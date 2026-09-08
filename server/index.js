import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import contactRouter from "./routes/contact.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/contact", contactRouter);

// Fallback 404 for anything else under /api
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Not found." });
});

// Central error handler — keeps stack traces out of responses
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.publicMessage || "Something went wrong on our end. Please try again shortly.",
  });
});

app.listen(PORT, () => {
  console.log(`JeysiDev portfolio API listening on port ${PORT}`);
});
