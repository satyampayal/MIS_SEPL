const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemIdentity",
      required: true,
    },

    mainStoreRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      default: null,
    },

    siteRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    transactionType: {
      type: String,
      enum: [
        "OPENING_STOCK",
        "CHALLAN_RESERVED",
        "CHALLAN_APPROVED_OUT",
        "CHALLAN_RECEIVED_SITE",
        "CHALLAN_REJECT_RELEASE",
        "STOCK_ADJUSTMENT",
        "CHALLAN_RECEIVED_MAIN_STORE",
      ],
      required: true,
    },

    direction: {
      type: String,
      enum: ["IN", "OUT", "RESERVE", "RELEASE"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    beforeStock: {
      type: Number,
      default: 0,
    },

    afterStock: {
      type: Number,
      default: 0,
    },

    beforeReservedStock: {
      type: Number,
      default: 0,
    },

    afterReservedStock: {
      type: Number,
      default: 0,
    },

    rate: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      default: 0,
    },

    referenceType: {
      type: String,
      enum: ["CHALLAN", "OPENING_STOCK", "ADJUSTMENT"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    referenceNumber: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);