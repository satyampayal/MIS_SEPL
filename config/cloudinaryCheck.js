const cloudinary = require("./cloudinary");

const checkCloudinaryConnection = async () => {
  try {
    const result = await cloudinary.api.ping();

    console.log("Cloudinary Connected Successfully 🚀");
    console.log(result);

  } catch (error) {
    console.log("Cloudinary Connection Error ❌");
    console.log(error.message);
  }
};

module.exports = checkCloudinaryConnection;