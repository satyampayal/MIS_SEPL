const express = require("express");
const StockTransactionRouter = express.Router();

const {
  getAllStockTransactions,
  getItemStockTimeline,
  getItemTimeline
} = require("../controllers/stockTransactionController");

const { isAuthenticated } = require("../middleware/auth.midlleware");

StockTransactionRouter.get("/all", isAuthenticated, getAllStockTransactions);
StockTransactionRouter.get("/item/:itemId", isAuthenticated, getItemStockTimeline);
StockTransactionRouter.get("/item-timeline/:itemId", isAuthenticated, getItemTimeline);

module.exports = StockTransactionRouter;