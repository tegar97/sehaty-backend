require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const ocrService = require("./src/services/ocrService"); // Sesuaikan path dengan lokasi file ocrService
const geminiService = require("./src/services/geminiService");
const nutriScore = require("./src/utils/nutriScore");
const axios = require("axios");
const { generateRandomFileName } = require("./src/utils/random");
const { query } = require("express");
const { gradeToEmoji } = require("./src/utils/emoji");



const API_BASE_URL = process.env.API_BASE_URL;
const userSessionsPath = path.join(__dirname, 'userSessions.json');
const userSessions = JSON.parse(fs.readFileSync(userSessionsPath, 'utf8') || '{}');


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
client.on('message_create', async (message) => {
  const chatId = message.from;
  const messageBody = message.body.trim();

  if (message.body === '!ping') {
    message.reply('pong');
  }

  if (message.body === '/help') {
    sendHelpMessage(message);
  }

  if (messageBody.startsWith('start_session')) {
    handleStartSession(message, chatId, messageBody);
  }

  if (messageBody === 'get_session') {
    handleGetSession(message, chatId);
  }

  if (messageBody === 'logout_session') {
    handleLogoutSession(message, chatId);
  }

  if (message.hasMedia && !message.fromMe) {
    handleMediaMessage(message, chatId , messageBody);
  }

  if (message.body.toLowerCase() === 'history') {
    handleHistory(message, chatId);
  }

  if (message.body.toLowerCase().startsWith('detail ')) {
    handleDetail(message, chatId, messageBody);
  }
});

function sendHelpMessage(message) {
  const helpMessage = `Langkah-langkah berikutnya untuk menggunakan layanan kami: 
  1. Kirim foto label nutrisi produk makanan atau minuman dan ada juga bisa memberi nama produk dengan mengetikan nama produk secara langsung di kolom pesan.
  2. Tunggu beberapa saat sementara kami memproses gambar Anda.
  3. Anda akan menerima data gizi yang diambil dari gambar.
  
  Contoh perintah yang tersedia:
  - Untuk melihat sesi aktif: ketik "get_session"
  - Untuk melihat riwayat pemindaian Anda: ketik "history"
  - Untuk logout: ketik "logout_session"
  
  Silakan kirim foto label nutrisi sekarang untuk memulai!`;

  message.reply(helpMessage);
}

async function handleStartSession(message, chatId, messageBody) {
  const code = messageBody.split(' ')[1];
  if (!code) {
    message.reply('Mohon ketikan dengan format : start_session <CODE>');
    return;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/api/whatsapp/start-session`, {
      code,
      userNumber: chatId,
    });

    if (response.status === 200) {
      message.reply('Sesi berhasil dimulai dan telah terhubung dengan aplikasi.');
      userSessions[chatId] = { code };
      fs.writeFileSync(userSessionsPath, JSON.stringify(userSessions, null, 2));

      message.reply(`Langkah-langkah berikutnya untuk menggunakan layanan kami: 
        1. Kirim foto label nutrisi produk makanan atau minuman dan ada juga bisa memberi nama produk dengan mengetikan nama produk secara langsung di kolom pesan.
        2. Tunggu beberapa saat sementara kami memproses gambar Anda.
        3. Anda akan menerima data gizi yang diambil dari gambar.
       
        Contoh perintah yang tersedia:
        - Untuk melihat riwayat pemindaian Anda: ketik "history"
        - Untuk melihat sesi aktif Anda: ketik "get_session"

        Silakan kirim foto label nutrisi sekarang untuk memulai!`);

      const tipsPhotoPath = path.join(__dirname, 'public', 'assets', 'tips1.png');
      const media = MessageMedia.fromFilePath(tipsPhotoPath);
      await client.sendMessage(message.from, media, {
        caption: 'Tips: Pastikan foto label nutrisi jelas, tidak gelap, tidak blur dan tidak terpotong.',
      });
    } else {
      message.reply(response.message);
    }
  } catch (error) {
    console.error('Error starting session:', error);
    message.reply('Error starting session. Please try again.');
    const errorMessage = error.response?.data?.message || 'Internal server error 500';
    message.reply(`Reason: ${errorMessage}`);
  }
}

async function handleGetSession(message, chatId) {
  if (userSessions[chatId] && userSessions[chatId].code) {
    const code = userSessions[chatId].code;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/whatsapp/check-session`, {
        headers: {
          'x-auth-token': code,
        },
      });

      if (response.status === 200) {
        const { userNumber, code } = response.data;
        message.reply(`Session is active.\nUser Number: ${userNumber}\nCode: ${code}`);
      } else {
        message.reply(response.data.message);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      const errorMessage = error.response?.data?.message || 'Error checking session. Please try again later.';
      message.reply(`Error checking session. Reason: ${errorMessage}`);
    }
  } else {
    message.reply('No session found.');
  }
}

function handleLogoutSession(message, chatId) {
  if (userSessions[chatId]) {
    delete userSessions[chatId];
    fs.writeFileSync(userSessionsPath, JSON.stringify(userSessions, null, 2));
    message.reply('You have been logged out.');
  } else {
    message.reply('No session found to logout.');
  }
}

async function handleMediaMessage(message, chatId, messageBody) {
  message.reply('Memproses gambar dan mengekstrak data nutrisi...');
  const media = await message.downloadMedia();

  if (media) {
    const fileName = generateRandomFileName(chatId, media.mimetype);
    const filePath = path.join(__dirname, 'public/uploads', fileName);

    fs.writeFileSync(filePath, media.data, 'base64');

    try {
      const text = await ocrService.extractText(filePath);
      const nutritionData = await geminiService.extractNutritionData(text);
      const { totalNutriScore, grade, portion100g, warnings } = nutriScore.calculateNutriScore(nutritionData);

      const responseMessage = `📊 *Informasi Gizi:*
━━━━━━━━━━━━━━━━━━━━
🍽️ *Ukuran Porsi:* ${nutritionData.portionSize} g
👨‍⚕️ *Data Gizi Lengkap:*
- ⚡ *Energi:* ${nutritionData.energy} kcal
- 🥓 *Lemak Total:* ${nutritionData.totalFat} g
- 🥚 *Protein:* ${nutritionData.protein} g
- 🍞 *Karbohidrat Total:* ${nutritionData.totalCarbs} g
- 🌾 *Serat Pangan:* ${nutritionData.dietaryFiber} g
- 🍭 *Gula:* ${nutritionData.sugars} g
- 🧂 *Natrium:* ${nutritionData.sodium} mg
- 🧀 *Kolesterol:* ${nutritionData.kolestrol} mg
━━━━━━━━━━━━━━━━━━━━
📅 *Per 100g/ml:*
- ⚡ *Energi:* ${portion100g.energy.toFixed(2)} kcal
- 🥓 *Lemak Total:* ${portion100g.totalFat.toFixed(2)} g
- 🥚 *Protein:* ${portion100g.protein.toFixed(2)} g
- 🍞 *Karbohidrat Total:* ${portion100g.totalCarbs.toFixed(2)} g
- 🌾 *Serat Pangan:* ${portion100g.dietaryFiber.toFixed(2)} g
- 🍭 *Gula:* ${portion100g.sugars.toFixed(2)} g
- 🧂 *Natrium:* ${portion100g.sodium.toFixed(2)} mg
━━━━━━━━━━━━━━━━━━━━
🏅 *NutriScore:*
- ⭐ *Skor:* ${totalNutriScore}
- 🔠 *Nilai:* ${grade}
━━━━━━━━━━━━━━━━━━━━
⚠️ *Peringatan:*
${warnings.length > 0 ? warnings.map((warning) => `- ${warning}`).join('\n') : '- Tidak ada peringatan'}
━━━━━━━━━━━━━━━━━━━━`;

      const gradeImages = {
        A: 'nutri-score-a.png',
        B: 'nutri-score-b.png',
        C: 'nutri-score-c.png',
        D: 'nutri-score-d.png',
        E: 'nutri-score-e.png',
      };

      const gradeCaptions = {
        A: 'NutriScore A: Sangat sehat, pilihan terbaik untuk dikonsumsi. Produk ini kaya akan nutrisi yang bermanfaat dan rendah kalori, gula, garam, dan lemak jenuh.',
        B: 'NutriScore B: Sehat, pilihan baik untuk dikonsumsi. Produk ini memiliki sedikit lebih banyak kalori, gula, garam, atau lemak jenuh tetapi masih merupakan pilihan yang sehat.',
        C: 'NutriScore C: Cukup sehat, boleh dikonsumsi secara moderat. Produk ini memiliki keseimbangan antara nutrisi yang bermanfaat dan yang kurang diinginkan.',
        D: 'NutriScore D: Kurang sehat, batasi konsumsi. Produk ini lebih tinggi kalori, gula, garam, atau lemak jenuh dan sebaiknya dikonsumsi secara terbatas.',
        E: 'NutriScore E: Tidak sehat, hindari konsumsi jika memungkinkan. Produk ini sangat tinggi kalori, gula, garam, atau lemak jenuh dan sebaiknya dikonsumsi sesedikit mungkin.',
      };

      const gradeImageFile = gradeImages[grade.toUpperCase()];
      const gradeCaption = gradeCaptions[grade.toUpperCase()];

      if (gradeImageFile && gradeCaption) {
        const gradePhotoPath = path.join(__dirname, 'public', 'assets', gradeImageFile);
        const gradePhoto = MessageMedia.fromFilePath(gradePhotoPath);
        await client.sendMessage(message.from, gradePhoto, { caption: gradeCaption });
      } else {
        message.reply('Nilai NutriScore tidak valid.');
      }

      message.reply(responseMessage);

      const productName = messageBody.length > 1 ? messageBody : 'Produk Tanpa Nama';

      const scanData = {
        name: productName,
        photo: fileName,
        nutrition: {
          energy: nutritionData.energy,
          totalFat: nutritionData.totalFat,
          protein: nutritionData.protein,
          totalCarbs: nutritionData.totalCarbs,
          dietaryFiber: nutritionData.dietaryFiber,
          sugars: nutritionData.sugars,
          sodium: nutritionData.sodium,
          portionSize: nutritionData.portionSize,
          cholesterol: nutritionData.kolestrol,
        },
        warnings,
        nutriScore: totalNutriScore,
        grade,
        portion100g: {
          energy: portion100g.energy,
          totalFat: portion100g.totalFat,
          protein: portion100g.protein,
          totalCarbs: portion100g.totalCarbs,
          dietaryFiber: portion100g.dietaryFiber,
          sugars: portion100g.sugars,
          sodium: portion100g.sodium,
          portionSize: '100g',
        },
      };

      const token = userSessions[chatId].code;
      await axios.post(`${API_BASE_URL}/api/product/add-history`, scanData, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      });
    } catch (error) {
      message.reply('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.');
      console.error(error);
    }
  }
}

async function handleHistory(message, chatId) {
  const userSession = userSessions[chatId];

  if (!userSession || !userSession.code) {
    message.reply('Anda perlu masuk (start_session) untuk melihat riwayat Anda.');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/product/get-history`, {
      headers: { 'x-auth-token': userSession.code },
    });

    const scanHistories = response.data.data;
    if (scanHistories.length === 0) {
      message.reply('Tidak ada riwayat scan yang ditemukan.');
      return;
    }

    let historyMessage = '*Riwayat Scan Anda:*\n\n';

    scanHistories.forEach((history, index) => {
      historyMessage += `${index + 1}) ${history.productName} - ${history.energy} Kalori - ${history.sugars}g Gula - *${history.grade}* grade\n`;
    });

    historyMessage += '\nUntuk melihat detail, ketik "detail [NOMOR]"';
    message.reply(historyMessage);
  } catch (error) {
    console.error('Error fetching scan histories:', error);
    message.reply('Terjadi kesalahan saat mengambil riwayat scan Anda. Silakan coba lagi nanti.');
  }
}

async function handleDetail(message, chatId, messageBody) {
  const userSession = userSessions[chatId];

  if (!userSession || !userSession.code) {
    message.reply('Anda perlu masuk untuk melihat detail.');
    return;
  }

  const detailNumber = parseInt(messageBody.split(' ')[1], 10);

  if (isNaN(detailNumber) || detailNumber < 1) {
    message.reply('Silakan berikan nomor yang valid.');
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/product/detail-history?index=${detailNumber - 1}`, {
      headers: { 'x-auth-token': userSession.code },
    });

    const historyDetail = response.data.data;

    const responseMessage = `
    *Detail untuk Produk: ${historyDetail.productName}*
    - Energi: ${historyDetail.energy} kcal
    - Total Lemak: ${historyDetail.totalFat} g
    - Protein: ${historyDetail.protein} g
    - Total Karbohidrat: ${historyDetail.totalCarbs} g
    - Serat Makanan: ${historyDetail.dietaryFiber} g
    - Gula: ${historyDetail.sugars} g
    - Natrium: ${historyDetail.sodium} mg
    - Ukuran Porsi: ${historyDetail.portionSize} g
    - Kolesterol: ${historyDetail.cholesterol} mg

    *Peringatan:*
    ${historyDetail.warnings}
  `;

    message.reply(responseMessage);
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Internal server error 500';
    message.reply(errorMessage);
  }
}

client.initialize();
