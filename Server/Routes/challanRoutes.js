const express = require("express");
const router = express.Router();

const {
  createChallan,
  getAllChallans,
  updateChallan,
} = require("../controllers/challanController");

const upload = require("../config/multer");

router.post("/add", createChallan);

router.get("/all", getAllChallans);

router.put("/update/:id", upload.single("signedChallanFile"), updateChallan);

module.exports = router;