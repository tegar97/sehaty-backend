const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), imageController.uploadImage);

module.exports = router;
