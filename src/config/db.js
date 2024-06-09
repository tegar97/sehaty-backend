const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const database = await mongoose.connection;

    database.on("error", (error) => {
      console.log(error);
    });

    database.once("connected", () => {
      console.log("Database Connected");
    });
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
