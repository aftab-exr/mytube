import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express();
// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:4000",
    credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (add when you create them)
import router from "./routes/user.route.js";
app.use("/api", router);

export default app;