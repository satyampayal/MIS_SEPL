const express = require("express");
const headStoreItemrouter = express.Router();

const {
  getHeadStoreReceivedItems,
} = require("../controllers/headStoreItemController");

headStoreItemrouter.get("/received-items", getHeadStoreReceivedItems);

module.exports = headStoreItemrouter;