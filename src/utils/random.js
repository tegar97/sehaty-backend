const crypto = require("crypto");
const path = require("path");

exports.generateRandomFileName = (chatId, mimetype) => {
  const extension = mimetype.split("/")[1];
  const randomString = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  const fileName = `${chatId}-${randomString}-${timestamp}.${extension}`;
  return fileName;
};
