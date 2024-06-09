const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads')); // Menyimpan di folder public/uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Menggunakan timestamp untuk nama file yang unik
  }
});


const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), imageController.uploadImage);

module.exports = router;
