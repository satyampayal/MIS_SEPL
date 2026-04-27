const mongoose = require("mongoose");

const taxInvoiceRegisterSchema = new mongoose.Schema(
  {
    invoiceDate: {
      type: String,
      required: true,
      trim: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    invoiceAmount: {
      type: Number,
      required: true,
    },

    vendorName: {
      type: String,
      required: true,
      trim: true,
    },

    projectSite: {
      type: String,
      required: true,
      trim: true,
    },

    challanCreated: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    challanNumber: {
      type: String,
      default: "",
      trim: true,
    },

    challanDate: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryStatus: {
      type: String,
      enum: ["delivered", "pending", "partial", ""],
      default: "",
    },

    quantitySent: {
      type: Number,
      default: 0,
    },

    quantityReceived: {
      type: Number,
      default: 0,
    },

    materialDifference: {
      type: String,
      enum: ["No Difference", "Difference Found"],
      default: "No Difference",
    },

    itemDetailsRequired: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },

    itemDetails: [
      {
        itemDescription: {
          type: String,
          default: "",
          trim: true,
        },

        hsnCode: {
          type: String,
          default: "",
          trim: true,
        },

        qty: {
          type: Number,
          default: 0,
        },

        rate: {
          type: Number,
          default: 0,
        },

        per: {
          type: String,
          default: "",
          trim: true,
        },

        discount: {
          type: Number,
          default: 0,
        },

        taxableValue: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TaxInvoiceRegister",
  taxInvoiceRegisterSchema
);