exports.calculateNutriScore = (data) => {
  const convertTo100g = (value, portionSize) => (value / portionSize) * 100;

  // Assuming portion size is 100g if portion size is 0
  const portionSize = data.portionSize > 0 ? data.portionSize : 100;

  const energy_kJ = convertTo100g(data.energy, portionSize);
  const sugars_g = convertTo100g(data.sugars, portionSize);
  const saturated_fat_g = convertTo100g(data.totalFat, portionSize); // Assuming totalFat includes saturated fat
  const sodium_mg = convertTo100g(data.sodium, portionSize);
  const fiber_g = convertTo100g(data.dietaryFiber, portionSize);
  const protein_g = convertTo100g(data.protein, portionSize);
  const cholesterol_mg = convertTo100g(data.kolestrol, portionSize);

  // Points calculation based on Nutri-Score
  const negativePoints =
    (energy_kJ > 335) +
    (energy_kJ > 670) +
    (energy_kJ > 1005) +
    (energy_kJ > 1340) +
    (energy_kJ > 1675) +
    (energy_kJ > 2010) +
    (energy_kJ > 2345) +
    (energy_kJ > 2680) +
    (energy_kJ > 3015) +
    (energy_kJ > 3350) +
    (sugars_g > 4.5) +
    (sugars_g > 9) +
    (sugars_g > 13.5) +
    (sugars_g > 18) +
    (sugars_g > 22.5) +
    (sugars_g > 27) +
    (sugars_g > 31) +
    (sugars_g > 36) +
    (sugars_g > 40) +
    (sugars_g > 45) +
    (saturated_fat_g > 1) +
    (saturated_fat_g > 2) +
    (saturated_fat_g > 3) +
    (saturated_fat_g > 4) +
    (saturated_fat_g > 5) +
    (saturated_fat_g > 6) +
    (saturated_fat_g > 7) +
    (saturated_fat_g > 8) +
    (saturated_fat_g > 9) +
    (saturated_fat_g > 10) +
    (sodium_mg > 90) +
    (sodium_mg > 180) +
    (sodium_mg > 270) +
    (sodium_mg > 360) +
    (sodium_mg > 450) +
    (sodium_mg > 540) +
    (sodium_mg > 630) +
    (sodium_mg > 720) +
    (sodium_mg > 810) +
    (sodium_mg > 900);

  const positivePoints =
    (fiber_g > 0.9) +
    (fiber_g > 1.9) +
    (fiber_g > 2.8) +
    (fiber_g > 3.7) +
    (fiber_g > 4.7) +
    (protein_g > 1.6) +
    (protein_g > 3.2) +
    (protein_g > 4.8) +
    (protein_g > 6.4) +
    (protein_g > 8) +
    0; // Placeholder for fruits, vegetables, and nuts percentage (0 for now)

  const totalNutriScore = negativePoints - positivePoints;

  // Determine Nutri-Score grade
  let grade;
  if (totalNutriScore <= -1) {
    grade = "A";
  } else if (totalNutriScore <= 2) {
    grade = "B";
  } else if (totalNutriScore <= 10) {
    grade = "C";
  } else if (totalNutriScore <= 18) {
    grade = "D";
  } else {
    grade = "E";
  }

  // Warnings for cholesterol, saturated fat, sugars, sodium, and total fat
  let warnings = [];
  let positiveFeedback = [];
  
  if (cholesterol_mg > 100) {
    warnings.push("Kolesterol tinggi");
  }
  
  if (saturated_fat_g > 5) {
    warnings.push("Lemak jenuh tinggi");
  }
  
  if (sugars_g > 15) {
    warnings.push("Gula tinggi");
  }
  
  if (sodium_mg > 540) {
    warnings.push("Natrium tinggi");
  }
  
  if (cholesterol_mg <= 200) {
    positiveFeedback.push("Kolesterol rendah");
  }
  
  if (saturated_fat_g < 1) {
    positiveFeedback.push("Lemak jenuh rendah");
  } 
  
  if (sugars_g < 5) {
    positiveFeedback.push("Gula rendah");
  }
  
  if (sodium_mg < 100) {
    positiveFeedback.push("Natrium rendah");
  } 
  

  
  
  // get data after convert to 100g

  const portion100g = {
    energy: Math.round(energy_kJ),
    totalFat: Math.round(saturated_fat_g),
    protein: Math.round(protein_g),
    totalCarbs: Math.round(data.totalCarbs),
    dietaryFiber: Math.round(fiber_g),
    sugars: Math.round(sugars_g),
    sodium: Math.round(sodium_mg),
    portionSize: "100g",
  };

  return { totalNutriScore, grade, portion100g, warnings , positiveFeedback};
};
