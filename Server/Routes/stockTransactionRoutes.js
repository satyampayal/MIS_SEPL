const express = require("express");
const StockTransactionRouter = express.Router();

const {
  getAllStockTransactions,
  getItemStockTimeline,
} = require("../controllers/stockTransactionController");

const { isAuthenticated } = require("../middleware/auth.midlleware");

StockTransactionRouter.get("/all", isAuthenticated, getAllStockTransactions);
StockTransactionRouter.get("/item/:itemId", isAuthenticated, getItemStockTimeline);

module.exports = StockTransactionRouter;