const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient();

exports.extractText = async (imagePath) => {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations;
    return detections.length > 0 ? detections[0].description : '';
  } catch (error) {
    throw new Error('Error extracting text from image using Google Cloud Vision');
  }
};

exports.extractNutritionData = (text) => {
  const nutritionInfo = {
    energy: extractValue(text, /Energi Total\s*:\s*([\d.,]+)\s*kkal/i),
    totalFat: extractValue(text, /Lemak Total\s*:\s*([\d.,]+)\s*g/i),
    protein: extractValue(text, /Protein\s*:\s*([\d.,]+)\s*g/i),
    totalCarbs: extractValue(text, /Karbohidrat Total\s*:\s*([\d.,]+)\s*g/i),
    dietaryFiber: extractValue(text, /Serat Pangan\s*:\s*([\d.,]+)\s*g/i),
    sugars: extractValue(text, /Gula\s*:\s*([\d.,]+)\s*g/i),
    sodium: extractValue(text, /Natrium\s*:\s*([\d.,]+)\s*mg/i),
    akg: extractAKGValues(text),
  };
  
  return nutritionInfo;
};

const extractValue = (text, regex) => {
  const match = text.match(regex);
  return match ? match[1] : 'Data not found';
};

const extractAKGValues = (text) => {
  const akgRegex = /(\d+%)\s*AKG/g;
  const akgValues = [];
  let match;
  while ((match = akgRegex.exec(text)) !== null) {
    akgValues.push(match[1]);
  }
  return akgValues;
};
