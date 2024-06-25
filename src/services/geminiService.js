require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const googleGenerativeAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.extractNutritionData = async (dirtyText) => {
  const model = googleGenerativeAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });

  console.log(dirtyText);

  const prompt = `
Extract the following nutritional data from the provided text and return it in the specified JSON format:

1. Energi Total (kcal)
2. Lemak Total (g)
3. Protein (g)
4. Karbohidrat Total (g)
5. Serat Pangan (g)
6. Gula (g)
7. Natrium (mg)
8. Takaran Saji (g) 
9 Kolestrol (mg )








Text to analyze:
${dirtyText}

Return the data in this format (don't include the square brackets, just the data inside them and dont use json format!)

  "energy": "value",  "totalFat": "value",  "protein": "value",  "totalCarbs": "value",  "dietaryFiber": "value",
  "sugars": "value",  "sodium": "value", "portionSize": "value", "kolestrol": "value" 

if the data is not found, replace the value with "0"
dont make new line or space between the data


  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  const text = await response.text();

  // Convert the response text into a JSON object
  const parsedData = text
    .split(",")
    .map((pair) => pair.split(":").map((str) => str.trim().replace(/"/g, "")))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  // Extract the desired values and convert to the specified format
  const formattedData = {
    energy: parseInt(parsedData.energy) || 0,
    totalFat: parseInt(parsedData.totalFat) || 0,
    protein: parseInt(parsedData.protein) || 0,
    totalCarbs: parseInt(parsedData.totalCarbs) || 0,
    dietaryFiber: parseInt(parsedData.dietaryFiber) || 0,
    sugars: parseInt(parsedData.sugars) || 0,
    sodium: parseInt(parsedData.sodium) || 0,
    portionSize: parseInt(parsedData.portionSize) || 0,
    kolestrol: parseInt(parsedData.kolestrol) || 0,
  };

  return formattedData;
};
