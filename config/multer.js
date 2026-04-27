const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "po-files",
    resource_type: "auto", // best option
    public_id: `${Date.now()}-${file.originalname.split(".")[0]}`
  })
});

const upload = multer({ storage,
      // 30 MB limit
  limits: {
    fileSize: 30 * 1024 * 1024
  },
 });

module.exports = upload;