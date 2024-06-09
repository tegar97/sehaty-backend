require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const ocrService = require("./src/services/ocrService"); // Sesuaikan path dengan lokasi file ocrService
const geminiService = require("./src/services/geminiService"); // Sesuaikan path dengan lokasi file extractNutritionData
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Token dari BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Buat bot dan atur polling
const bot = new TelegramBot(token, { polling: true });

// Fungsi untuk menangani pesan foto
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  const photo = msg.photo[msg.photo.length - 1]; // Dapatkan resolusi tertinggi
  const fileId = photo.file_id;

  try {
    // Dapatkan URL file
    const file = await bot.getFile(fileId);
    const filePath = file.file_path;
    const url = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // Unduh file
    const downloadPath = path.join(__dirname, "uploads", `${fileId}.jpg`);

    // Pastikan direktori uploads ada
    if (!fs.existsSync(path.join(__dirname, "uploads"))) {
      fs.mkdirSync(path.join(__dirname, "uploads"));
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Gagal mengunduh file: ${response.statusText}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync(downloadPath, buffer);

    // Ekstraksi teks dari gambar
    const text = await ocrService.extractText(downloadPath);

    // Ekstraksi data nutrisi dari teks
    const nutritionData = await geminiService.extractNutritionData(text);

    // Kirim respons ke pengguna
    bot.sendMessage(chatId, JSON.stringify(nutritionData, null, 2));
    bot.sendMessage(chatId, 'Apakah anda ingin memasukan data nutrisi ke dalam database sebagai nutrisi harian? (yes/no)');
    // if user input yes, then save the data to database
    // if user input no, then do nothing
    
    bot.onText(/yes/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Data berhasil disimpan');
        }
    );
    bot.onText(/no/, async (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'Data tidak disimpan');
        }
    );

    // Hapus file setelah selesai
    fs.unlinkSync(downloadPath);
  } catch (error) {
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat memproses gambar. Silakan coba lagi."
    );
    console.error(error);
  }
});

// Fungsi untuk mengirim pesan awal dengan opsi login
const sendInitialMessage = (chatId) => {
  const options = {
    reply_markup: {
      keyboard: [[{ text: "1. Login" }]],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  };

  bot.sendMessage(chatId, "Welcome! Please choose an option:", options);
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sendInitialMessage(chatId);
});

bot.onText("1. Login", (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Please enter your login code in the format "login <CODE>"'
  );
});

bot.onText(/login (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];

  try {
    const getLogin = await fetch(
      `http://localhost:3000/api/auth/telegram-login?code=${code}`
    );
    const response = await getLogin.json();

    if (response._id != null) {
      bot.sendMessage(chatId, "Login successful!");
      // send user data
      bot.sendMessage(chatId, 'hello ' + response.name + ' ' + response.email );
    } else {
      bot.sendMessage(chatId, "Login failed. Please try again.");
    }
    console.log(response);
  } catch (error) {
    console.error(error);
  }
});
