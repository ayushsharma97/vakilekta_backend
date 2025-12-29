// const mysql = require("mysql2/promise"); // ✅ promise version

// // const pool = mysql.createPool({
// //     host: process.env.DB_HOST || "localhost",
// //     user: process.env.DB_USER || "root",
// //     password: process.env.DB_PASSWORD || "",
// //     database: process.env.DB_NAME || "vakilekta",
// //     port: 3307,
// //     waitForConnections: true,
// //     connectionLimit: 10,
// //     queueLimit: 0,
// // });

// const pool = mysql.createPool({
//     host: "localhost",
//     user: "root",
//     password: "",
//     database: "vakilekta_db",
//     port: 3306,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
// });

// module.exports = { pool };

const mongoose = require("mongoose");

const MONGO_URI = process.env.MongoDB_URI;
// or for Atlas:
// const MONGO_URI = "mongodb+srv://<username>:<password>@cluster.mongodb.net/vakilekta_db";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI)
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;

