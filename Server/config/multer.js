const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {

    let folderName = "misc/other";

    // 🔥 Perfect control using fieldname
    if (file.fieldname === "invoiceFile") {
      folderName = "misc/tax-invoices";
    } 
    else if (file.fieldname === "challanFile") {
      folderName = "misc/delivery-challans";
    } 
    else if (file.fieldname === "projectFile") {
      folderName = "misc/project-files";
    }
     else if (file.fieldname === "poFile") {
      folderName = "misc/po-file";
    }
    else if (file.fieldname === "billFile") {
      folderName = "misc/bill-file";
    }

    return {
      folder: folderName,
      resource_type: "auto",
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

module.exports = upload;