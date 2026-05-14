const mongoose = require("mongoose");

const storeItemSchema = new mongoose.Schema(
  {
    masterStoreRef:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      default: null,  
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    itemCode: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    hsnCode: {
      type: String,
      default: "",
      trim: true,
    },

    boqNo: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      required: true,
      default: "Nos",
    },

    openingStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    reorderLevel: {
      type: Number,
      default: 0,
      min: 0,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    averagePurchaseRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastPurchaseRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalStockValue: {
      type: Number,
      default: 0,
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

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    make: {
      type: String,
      default: "",
      trim: true,
    },

    supplierName: {
      type: String,
      default: "",
      trim: true,
    },

    gstPercentage: {
      type: Number,
      default: 0,
    },

    itemImage: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Available", "Low Stock", "Out Of Stock", "Inactive"],
      default: "Available",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

storeItemSchema.pre("save", function (next) {
  this.totalStockValue =
    Number(this.currentStock || 0) * Number(this.rate || 0);

  if (this.currentStock <= 0) {
    this.status = "Out Of Stock";
  } else if (this.currentStock <= this.minimumStock) {
    this.status = "Low Stock";
  } else {
    this.status = "Available";
  }

 
});

module.exports = mongoose.model("StoreItem", storeItemSchema);