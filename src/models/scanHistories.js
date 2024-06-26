
const mongoose = require("mongoose");

const scanHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  nutrition: {
    energy: Number,
    totalFat: Number,
    protein: Number,
    totalCarbs: Number,
    dietaryFiber: Number,
    sugars: Number,
    sodium: Number,
    portionSize: Number,
    cholesterol: Number,
  },
  nutriScore: Number,
  grade: {
    type: String,
    enum: ["A", "B", "C", "D", "E"],
  },
  whatsappToken : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "whatsappToken",
    required: false,
  },
  portion100g: {
    energy: Number,
    totalFat: Number,
    protein: Number,
    totalCarbs: Number,
    dietaryFiber: Number,
    sugars: Number,
    sodium: Number,
    portionSize: {
      type: String,
      default: "100g",
    },
  },
  warnings: [String],
  positive : [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model("ScanHistory", scanHistorySchema);