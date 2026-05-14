const mongoose = require("mongoose");
const dns=require("dns")

// for the new mongoose rule 
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])
const connectDB = async (connection_string) => {
  try {
    await mongoose.connect(connection_string);

    console.log("MongoDB Connected Successfully 🚀");
  } catch (error) {
    console.log("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;