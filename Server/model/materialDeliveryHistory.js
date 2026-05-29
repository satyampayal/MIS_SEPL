const mongoose = require("mongoose");

const materialDeliveryHistorySchema = new mongoose.Schema(
  {
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    boqItemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectBoqItem",
      required: true,
    },

    itemIdentityRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemIdentity",
      required: true,
    },

    challanRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challan",
      default: null,
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    quantitySent: {
      type: Number,
      default: 0,
    },

    quantityReceived: {
      type: Number,
      default: 0,
    },

    vendorName: {
      type: String,
      default: "",
    },

    vehicleNumber: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MaterialDeliveryHistory",
  materialDeliveryHistorySchema
);