const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Home Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        application: "RotaStar Backend",
        message: "🚀 Backend Server is Running Successfully!"
    });
});

// Test API
app.get("/api/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API Working Perfectly!"
    });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("==================================");
    console.log("🚀 RotaStar Backend Started");
    console.log(`🌐 Server : http://localhost:${PORT}`);
    console.log("==================================");
});