const mongoose = require("mongoose");

const materialRequisitionSchema = new mongoose.Schema(
  {
    requisitionNumber: {
      type: String,
      unique: true,
      required: true,
    },

    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    requiredDate: {
      type: Date,
      required: true,
    },

    priority: {
      type: String,
      enum: ["NORMAL", "URGENT", "CRITICAL"],
      default: "NORMAL",
    },

    purpose: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "PARTIAL_ISSUED",
        "ISSUED",
      ],
      default: "SUBMITTED",
    },

    items: [
      {
        itemRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ItemIdentity",
          required: true,
        },

        itemName: String,
        itemCode: String,
        unit: String,

        requiredQty: {
          type: Number,
          required: true,
          min: 0,
        },

        approvedQty: {
          type: Number,
          default: 0,
        },

        issuedQty: {
          type: Number,
          default: 0,
        },

        availableQty: {
          type: Number,
          default: 0,
        },

        shortageQty: {
          type: Number,
          default: 0,
        },

        suggestedAction: {
          type: String,
          enum: ["DC", "PURCHASE", "DC_AND_PURCHASE"],
          default: "PURCHASE",
        },

        remarks: {
          type: String,
          default: "",
        },
      },
    ],

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: Date,

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MaterialRequisition",
  materialRequisitionSchema
);