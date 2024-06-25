const ocrService = require("../services/ocrService");
const geminiService = require("../services/geminiService");
const nutriScore = require("../utils/nutriScore");
exports.uploadImage = async (req, res, next) => {
  try {
    // Validasi input: cek apakah ada file yang di-upload
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "File gambar tidak ditemukan. Silakan unggah file gambar.",
      });
    }

    const imagePath = req.file.path;
    const text = await ocrService.extractText(imagePath);
    const nutritionData = await geminiService.extractNutritionData(text);
    if (!nutritionData) {
      return res.status(400).json({
        status: "error",
        data : null,
        message:
          "Data nutrisi tidak ditemukan dalam gambar. Pastikan gambar mengandung informasi nutrisi yang valid.",
      });
    }

    // Tambahkan validasi untuk memastikan tidak semua nilai dalam nutritionData adalah 0
    const allZero = Object.values(nutritionData).every(value => value === 0);
    if (allZero) {
      return res.status(400).json({
        status: "error",
        message:
          "Semua nilai nutrisi adalah 0. Pastikan gambar mengandung informasi nutrisi yang valid.",
      });
    }
    // Validasi output dari OCR dan ekstraksi nutrisi
    if (!nutritionData) {
      return res.status(400).json({
        status: "error",
        message:
          "Data nutrisi tidak ditemukan dalam gambar. Pastikan gambar mengandung informasi nutrisi yang valid.",
      });
    }

    // Hitung Nutri-Score
    const { totalNutriScore, grade, portion100g, warnings  , positiveFeedback} =
      nutriScore.calculateNutriScore(nutritionData);

    res.status(200).json({
      status: "success",
      message: "Data nutrisi berhasil diproses.",
      data: {
        nutrition: nutritionData,
        nutriScore: totalNutriScore,
        productPhoto : `${process.env.ASSET_URL}/uploads/${req.file.filename}`,
        grade, 
        portion100g,
        warnings : warnings,
        positiveFeedback : positiveFeedback 
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat memproses data nutrisi.",
      error: error.message,

    });
    next(error);
  }
};
