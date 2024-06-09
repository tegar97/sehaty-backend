const ocrService = require('../services/ocrService');
const geminiService = require('../services/geminiService');
const nutriScore = require('../utils/nutriScore');
exports.uploadImage = async (req, res, next) => {
  try {
    const imagePath = req.file.path;
    const text = await ocrService.extractText(imagePath);
    const nutritionData = await geminiService.extractNutritionData(text);
     // Calculate Nutri-Score
     const {totalNutriScore,grade , portion100g , warnings}  = nutriScore.calculateNutriScore(nutritionData);
     res.status(200).json({
        status: "success",
        message: "Nutrition data processed successfully",
        data: {
          nutrition: nutritionData,
          nutriScore: totalNutriScore,
          grade: grade,
          portion100g: portion100g,
          warnings: warnings
        }
      });
  } catch (error) {
    res.status(500).json({
        status: "error",
        message: "An error occurred while processing the nutrition data",
        error: error.message
      });
    next(error);
  }
};
