const express = require("express");
const challanRouter = express.Router();

const {
    createChallan,
    getChallanByNumber,
    getAllChallans
} = require("../controllers/challanController");

const upload = require("../config/multer");

challanRouter.post("/create", upload.single("challanFile"), createChallan);

challanRouter.get("/track/:challanNumber", getChallanByNumber);

challanRouter.get("/all", getAllChallans);

module.exports = challanRouter;