const express = require("express");
const chllanRouter = express.Router();

const {
  createChallan,
  getAllChallans,
  updateChallan,
} = require("../controllers/challanController");

const upload = require("../config/multer");

chllanRouter.post("/add", createChallan);

chllanRouter.get("/all", getAllChallans);

chllanRouter.put("/update/:id", upload.single("signedChallanFile"), updateChallan);

module.exports = chllanRouter;