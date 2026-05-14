const multer = require("multer");

const storage = multer.memoryStorage();

const uploadExcel = multer({
  storage
});

module.exports = uploadExcel;