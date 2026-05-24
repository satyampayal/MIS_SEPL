const mongoose = require("mongoose");

const taxInvoiceRegisterSchema = new mongoose.Schema(
  {
invoiceDate: {
  type: Date,
  required: true,
},

    invoiceNumber: {
      type: String,
      required: true,
      // unique: true,
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
    typeOfChallan:{
      type:String,
      enum:["DDC","DC","MRN","LPN",""],
      default:"DDC"
    },

    challanCreated: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    challanNumber: {
      type: String,
      default: "",
      trim: true,
    },

 challanDate: {
  type: Date,
  default: null,
},

    deliveryStatus: {
      type: String,
      enum: ["Delivered", "Pending", "Partial", ""],
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
    invoiceFile: {
      type: String, // cloudinary URL
      default: "",
    },

    challanFile: {
      type: String, // cloudinary URL
      default: "",
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TaxInvoiceRegister",
  taxInvoiceRegisterSchema
);