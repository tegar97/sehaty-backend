const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const errorHandler = require("./middlewares/errorHandler");
const userRoutes = require("./routes/userRoutes");
const imageRoutes = require("./routes/imageRoutes");
const authRoutes = require("./routes/userRoutes");
const userWhatsappRoutes = require("./routes/userWhatsappRoutes");
const connectDB = require("./config/db");

const app = express();
connectDB();
// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(logger);
app.use(express.static('public'))

// Routes
app.use("/api/users", userRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/whatsapp", userWhatsappRoutes);

app.use("/api/auth", authRoutes);



// Error Handler
app.use(errorHandler);

module.exports = app;
