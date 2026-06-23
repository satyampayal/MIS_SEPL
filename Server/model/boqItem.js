const mongoose = require("mongoose");

const boqItemSchema = new mongoose.Schema(
  {
    boqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQMaster",
      required: true,
      index: true,
    },

    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
      index: true,
    },

    boqItemCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    activity: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    boqSrNo: {
      type: String,
      trim: true,
      default: "",
    },
    supplyItemCode:{
       type: String,
      trim: true,
      default: "",
    },
     installationItemCode:{
       type: String,
      trim: true,
      default: "",
    },

    generalName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    normalizedText: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    aliases: {
      type: [String],
      default: [],
      index: true,
    },

    uom: {
      type: String,
      trim: true,
      default: "",
    },

    poQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    qtyText: {
      type: String,
      default: "",
    },


    supplyRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    supplyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    installationRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    installationAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    contractorInstallationRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    contractorInstallationAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    approvedQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    billedQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

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
      index: true,
    },

    sourceRowNumber: {
      type: Number,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
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

    status: {
      type: String,
      enum: ["ACTIVE", "HOLD", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

boqItemSchema.index({
  projectRef: 1,
  activity: "text",
  generalName: "text",
  description: "text",
  aliases: "text",
  keywords: "text",
});

boqItemSchema.pre("save", function () {
  const qty = Number(this.poQty || 0);
  const done = Number(this.completedQty || 0);

  this.balanceQty = Math.max(qty - done, 0);
  this.progressPercent = qty > 0 ? Math.min((done / qty) * 100, 100) : 0;

  this.supplyAmount = qty * Number(this.supplyRate || 0);
  this.installationAmount = qty * Number(this.installationRate || 0);
  this.contractorInstallationAmount =
    qty * Number(this.contractorInstallationRate || 0);

  this.normalizedText = [
    this.activity,
    this.generalName,
    this.description,
    this.boqSrNo,
    this.boqItemCode,
    ...(this.aliases || []),
    ...(this.keywords || []),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // next();
});

module.exports = mongoose.model("BOQItem", boqItemSchema);