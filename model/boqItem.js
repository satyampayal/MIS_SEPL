const mongoose = require("mongoose");

const boqItemSchema = new mongoose.Schema(
  {
    boqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQMaster",
      default: null,
    },

    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },

    // ===== BASIC DETAILS =====

    boqItemCode: {
      type: String,
      trim: true,
      default: "",
    },

    activity: {
      type: String,
      trim: true,
      default: "",
    },

    boqSrNo: {
      type: String,
      trim: true,
      default: "",
    },

    generalName: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    uom: {
      type: String,
      trim: true,
      default: "",
    },

    // ===== QUANTITY =====

    poQty: {
      type: Number,
      default: 0,
    },

    qtyText: {
      type: String,
      default: "",
    },

    // ===== NORMAL INSTALLATION =====

    installationRate: {
      type: Number,
      default: 0,
    },

    installationAmount: {
      type: Number,
      default: 0,
    },

    // ===== CONTRACTOR INSTALLATION =====

    contractorInstallationRate: {
      type: Number,
      default: 0,
    },

    contractorInstallationAmount: {
      type: Number,
      default: 0,
    },

    // ===== DPR / BILLING =====

    completedQty: {
      type: Number,
      default: 0,
    },

    billedQty: {
      type: Number,
      default: 0,
    },

    balanceQty: {
      type: Number,
      default: 0,
    },

    // ===== CATEGORIZATION =====

    category: {
      type: String,
      trim: true,
      default: "",
    },

    subCategory: {
      type: String,
      trim: true,
      default: "",
    },

    keywords: {
      type: [String],
      default: [],
    },

    // ===== EXTRA =====

    sourceRowNumber: {
      type: Number,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
    },

    isExtraItem: {
      type: Boolean,
      default: false,
    },

    isRevisedItem: {
      type: Boolean,
      default: false,
    },

    parentBoqItemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQItem",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BOQItem", boqItemSchema);