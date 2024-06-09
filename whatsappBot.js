const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const ocrService = require("./src/services/ocrService"); // Sesuaikan path dengan lokasi file ocrService
const geminiService = require("./src/services/geminiService");
const nutriScore = require("./src/utils/nutriScore");
const axios = require("axios");

let userSessions = {};
const userSessionsPath = path.join(__dirname, "userSessions.json");
if (fs.existsSync(userSessionsPath)) {
  userSessions = JSON.parse(fs.readFileSync(userSessionsPath, "utf8"));
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  },
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("message_create", async (message) => {
  if (message.body === "!ping") {
    // reply back "pong" directly to the message
    message.reply("pong");
  }
  if (message.body === "/help") {
    // reply back "pong" directly to the message
    message.reply("help command");
  }
  const chatId = message.from;
  const messageBody = message.body.trim();

  if (messageBody.startsWith("start_session")) {
    const code = messageBody.split(" ")[1];
    userSessions[chatId] = { code };
    fs.writeFileSync(userSessionsPath, JSON.stringify(userSessions, null, 2));
    if (!code) {
      message.reply(
        "Please provide a code in the format: start_session <CODE>"
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/whatsapp/start-session",
        {
          code,
          userNumber: chatId,
        }
      );

      if (response.status === 200) {
        message.reply(
          "Session started successfully and has been success linked with application."
        );
      } else {
        message.reply(response.message);
      }
    } catch (error) {
      console.error("Error starting session:", error);
      message.reply("Error starting session. Please try again.");
      const errorMessage =
        error.response?.data?.message ||
        "Error starting session. Please try again later.";
      message.reply(`Reason: ${errorMessage}`);
    }

    return;
  }

  if (messageBody === "get_session") {
    if (userSessions[chatId] && userSessions[chatId].uniqueCode) {
      message.reply(`Your session code is: ${userSessions[chatId].uniqueCode}`);
    } else {
      message.reply(
        'No session found. Please start a session with "start_session <UNIQUE_CODE>".'
      );
    }
    return;
  }

  if (messageBody === "logout_session") {
    if (userSessions[chatId]) {
      delete userSessions[chatId];
      fs.writeFileSync(userSessionsPath, JSON.stringify(userSessions, null, 2));
      message.reply("You have been logged out.");
    } else {
      message.reply("No session found to logout.");
    }
    return;
  }

  // user can start session and front session have unique

  if (message.hasMedia) {
    const media = await message.downloadMedia();

    if (media) {
      // Dapatkan ekstensi file dari mimetype
      const extension = media.mimetype.split("/")[1];
      const fileName = `upload.${extension}`;
      const filePath = path.join(__dirname, "uploads", fileName);

      // Simpan file media ke sistem file
      fs.writeFileSync(filePath, media.data, "base64");

      try {
        // Ekstraksi teks dari gambar
        const text = await ocrService.extractText(filePath);

        // Ekstraksi data nutrisi dari teks
        const nutritionData = await geminiService.extractNutritionData(text);
        const { totalNutriScore, grade, portion100g, warnings } =
          nutriScore.calculateNutriScore(nutritionData);

        const responseMessage = `
        *Nutrition Data:*
        - Energy: ${nutritionData.energy} kcal
        - Total Fat: ${nutritionData.totalFat} g
        - Protein: ${nutritionData.protein} g
        - Total Carbs: ${nutritionData.totalCarbs} g
        - Dietary Fiber: ${nutritionData.dietaryFiber} g
        - Sugars: ${nutritionData.sugars} g
        - Sodium: ${nutritionData.sodium} mg
        - Portion Size: ${nutritionData.portionSize} g
        - Cholesterol: ${nutritionData.kolestrol} mg
        
        *NutriScore:*
        - Score: ${totalNutriScore}
        - Grade: ${grade}
        
        *Per 100g:*
        - Energy: ${portion100g.energy.toFixed(2)} kcal
        - Total Fat: ${portion100g.totalFat.toFixed(2)} g
        - Protein: ${portion100g.protein.toFixed(2)} g
        - Total Carbs: ${portion100g.totalCarbs.toFixed(2)} g
        - Dietary Fiber: ${portion100g.dietaryFiber.toFixed(2)} g
        - Sugars: ${portion100g.sugars.toFixed(2)} g
        - Sodium: ${portion100g.sodium.toFixed(2)} mg
        
        *Warnings:*
        ${warnings.join("\n")}
                        `;

        // Kirim respons ke pengguna
        message.reply(responseMessage);

        // Hapus file setelah selesai
        fs.unlinkSync(filePath);
      } catch (error) {
        message.reply(
          "Terjadi kesalahan saat memproses gambar. Silakan coba lagi."
        );
        console.error(error);
      }
    }
  }
});

client.initialize();
