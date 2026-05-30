const mongoose = require("mongoose");

const stockBatchSchema = new mongoose.Schema(
  {
    mainStoreRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      required: true,
    },

    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemIdentity",
      required: true,
    },

    partyRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartyMaster",
      default: null,
    },

    sourceType: {
      type: String,
      enum: [
        "VENDOR_PURCHASE",
        "SITE_RETURN",
        "REPAIR_RETURN",
        "SITE_COMPLETION_RETURN",
        "ADJUSTMENT_IN",
      ],
      required: true,
    },

    documentType: {
      type: String,
      enum: ["MRN", "GRN", "MRS", "RETURN_NOTE", "ADJUSTMENT"],
      required: true,
    },

    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },

    documentDate: {
      type: Date,
      required: true,
    },

    receivedQty: {
      type: Number,
      required: true,
      min: 0,
    },

    remainingQty: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    landingRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      default: 0,
    },

    movementRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialMovement",
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CONSUMED", "CANCELLED"],
      default: "ACTIVE",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

stockBatchSchema.pre("save", function (next) {
  this.amount =
    Number(this.receivedQty || 0) * Number(this.landingRate || this.rate || 0);

  if (this.remainingQty <= 0) {
    this.status = "CONSUMED";
  }

  // next();
});

stockBatchSchema.index({
  mainStoreRef: 1,
  itemRef: 1,
  documentNumber: 1,
});

module.exports = mongoose.model("StockBatch", stockBatchSchema);