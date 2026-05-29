const mongoose = require("mongoose");

const itemIdentitySchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    itemCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
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

    unit: {
      type: String,
      required: true,
      default: "Nos",
      trim: true,
    },

    hsnCode: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    specification: {
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

    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
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

    itemImage: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
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

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Better duplicate control
// itemMasterSchema.index({ itemCode: 1 }, { unique: true });
itemIdentitySchema.index({ itemName: 1, unit: 1, brand: 1, make: 1 });

module.exports = mongoose.model("ItemIdentity", itemIdentitySchema);