const mongoose = require("mongoose");

const contractorSchema = new mongoose.Schema(
  {
    contractorName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    contractorCode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },

    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },

    panNumber: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    workTypes: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLACKLISTED"],
      default: "ACTIVE",
      index: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Contractor ||
  mongoose.model("Contractor", contractorSchema);