const mongoose = require("mongoose");

const boqMasterSchema = new mongoose.Schema(
  {
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },

    boqName: {
      type: String,
      required: true,
      trim: true,
    },

    boqType: {
      type: String,
      enum: ["CLIENT", "CONTRACTOR", "REVISED", "EXTRA_WORK"],
      default: "CLIENT",
    },

    revisionNo: {
      type: Number,
      default: 0,
    },

    originalFileUrl: {
      type: String,
      default: "",
    },

    originalFilePublicId: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
    },

    remarks: {
      type: String,
      default: "",
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BOQMaster", boqMasterSchema);