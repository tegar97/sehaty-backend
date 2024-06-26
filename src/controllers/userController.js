const product = require("../models/product");
const scanHistories = require("../models/scanHistories");
const whatsappToken = require("../models/whatsappToken");

// skipcq: JS-0045
exports.createScanHistory = async (req, res) => {
  try {
    const { name, photo, nutrition, nutriScore, grade, portion100g, warnings, positive } =
      req.body;

    // skipcq: JS-0123, JS-0123
    const newProduct = new product({
      name,
      photo,
    });

    await newProduct.save();

    //whatsapp token
    const signKey = req.signKey;

    const token = await whatsappToken.findOne({
      signkey: signKey,
      isLinked: true,
    });
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Tidak terotorisasi",
      });
    }

    const newScanHistory = new scanHistories({
      productId: newProduct._id,
      nutrition,
      nutriScore,
      grade,
      whatsappToken: token,
      portion100g,
      warnings,
      positive
    });


    await newScanHistory.save();

    res.status(201).json({
      status: "success",
      message: "Riwayat pemindaian berhasil disimpan",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving scan history",
      error: error.message,
    });
  }
};

exports.getScanHistories = async (req, res) => {
  try {
    const signKey = req.signKey;

    const token = await whatsappToken.findOne({
      signkey: signKey,
      isLinked: true,
    });

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Tidak terotorisasi",
      });
    }
    const scanHistoriesData = await scanHistories
      .find({ whatsappToken: token })
      .populate("productId");

    

    // Transform the data to flatten the structure and convert warnings array to string
    const transformedData = scanHistoriesData.map((scan) => {
      return {
        _id: scan._id,
        productId: scan.productId._id,
        productName: scan.productId.name,
        productPhoto: `${process.env.ASSET_URL}/uploads/${scan.productId.photo}`,
        energy: scan.nutrition.energy,
        totalFat: scan.nutrition.totalFat,
        protein: scan.nutrition.protein,
        totalCarbs: scan.nutrition.totalCarbs,
        dietaryFiber: scan.nutrition.dietaryFiber,
        sugars: scan.nutrition.sugars,
        sodium: scan.nutrition.sodium,
        portionSize: scan.nutrition.portionSize,
        nutriScore: scan.nutriScore,
        grade: scan.grade,
        portion100gEnergy: scan.portion100g.energy,
        portion100gTotalFat: scan.portion100g.totalFat,
        portion100gProtein: scan.portion100g.protein,
        portion100gTotalCarbs: scan.portion100g.totalCarbs,
        portion100gDietaryFiber: scan.portion100g.dietaryFiber,
        portion100gSugars: scan.portion100g.sugars,
        portion100gSodium: scan.portion100g.sodium,
        portion100gSize: scan.portion100g.portionSize,
        warnings: scan.warnings,
        positive : scan.positive,
        createdAt: scan.createdAt,
      };
    });
    
    res.status(200).json({
      status: "success",
      message: "Scan histories fetched successfully",
      data: transformedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching scan histories",
      error: error.message,
    });
  }
};

// api detail
exports.getScanHistoryDetail = async (req, res) => {
  try {
    const signKey = req.signKey;
    const index = req.query.index;

    if (index === undefined) {
      return res.status(400).json({ message: "Index is required" });
    }

    const token = await whatsappToken.findOne({
      signkey: signKey,
      isLinked: true,
    });

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const scanHistorie = await scanHistories
      .find({ whatsappToken: token })
      .populate("productId");

    if (index < 0 || index >= scanHistorie.length) {
      return res.status(404).json({ message: "Scan history not found" });
    }

    const scanHistory = scanHistorie[index];

    const transformedData = {
      _id: scanHistory._id,
      productId: scanHistory.productId._id,
      productName: scanHistory.productId.name,
      productPhoto: `${process.env.ASSET_URL}/uploads/${scanHistory.productId.photo}`,
      energy: scanHistory.nutrition.energy,
      totalFat: scanHistory.nutrition.totalFat,
      protein: scanHistory.nutrition.protein,
      totalCarbs: scanHistory.nutrition.totalCarbs,
      dietaryFiber: scanHistory.nutrition.dietaryFiber,
      sugars: scanHistory.nutrition.sugars,
      sodium: scanHistory.nutrition.sodium,
      portionSize: scanHistory.nutrition.portionSize,
      nutriScore: scanHistory.nutriScore,
      grade: scanHistory.grade,
      portion100gEnergy: scanHistory.portion100g.energy,
      portion100gTotalFat: scanHistory.portion100g.totalFat,
      portion100gProtein: scanHistory.portion100g.protein,
      portion100gTotalCarbs: scanHistory.portion100g.totalCarbs,
      portion100gDietaryFiber: scanHistory.portion100g.dietaryFiber,
      portion100gSugars: scanHistory.portion100g.sugars,
      portion100gSodium: scanHistory.portion100g.sodium,
      portion100gSize: scanHistory.portion100g.portionSize,
      warnings: scanHistory.warnings.join(", "), // Menggabungkan array menjadi string
      createdAt: scanHistory.createdAt,
    };

    res.status(200).json({
      status: "success",
      message: "Scan history fetched successfully",
      data: transformedData,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching scan history",
      error: error.message,
    });
  }
};
