const mongoose = require("mongoose");

const mainStoreStockSchema = new mongoose.Schema(
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

    currentStock: {
      type: Number,
      default: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableStock: {// currentStock-reservedStock
      type: Number,
      default: 0,
    },

    averageRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockValue: {
      type: Number,
      default: 0,
    },

    minimumStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    rackNumber: {
      type: String,
      default: "",
      trim: true,
    },

    stockStatus: {
      type: String,
      enum: ["AVAILABLE", "LOW_STOCK", "OUT_OF_STOCK", "NEGATIVE_STOCK"],
      default: "OUT_OF_STOCK",
    },


    lastMovementDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

mainStoreStockSchema.pre("save", function (next) {
  this.availableStock =
    Number(this.currentStock || 0) - Number(this.reservedStock || 0);

  this.stockValue =
    Number(this.currentStock || 0) * Number(this.averageRate || 0);

  if (this.currentStock < 0) {
    this.stockStatus = "NEGATIVE_STOCK";
  } else if (this.currentStock === 0) {
    this.stockStatus = "OUT_OF_STOCK";
  } else if (this.currentStock <= this.minimumStockLevel) {
    this.stockStatus = "LOW_STOCK";
  } else {
    this.stockStatus = "AVAILABLE";
  }

  // next();
});

mainStoreStockSchema.index(
  { mainStoreRef: 1, itemRef: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.MainStoreStock ||
  mongoose.model("MainStoreStock", mainStoreStockSchema);