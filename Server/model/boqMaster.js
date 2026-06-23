const mongoose = require("mongoose");

const boqMasterSchema = new mongoose.Schema(
  {
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
      index: true,
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
      index: true,
    },

    revisionNo: {
      type: Number,
      default: 0,
    },

    isCurrent: {
      type: Boolean,
      default: true,
    },

    originalFileUrl: {
      type: String,
      default: "",
    },

    originalFilePublicId: {
      type: String,
      default: "",
    },

    totalItems: {
      type: Number,
      default: 0,
    },

    totalBoqAmount: {
      type: Number,
      default: 0,
    },

    totalContractorAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

boqMasterSchema.index({
  projectRef: 1,
  contractorRef: 1,
  boqType: 1,
  revisionNo: 1,
});

module.exports = mongoose.model("BOQMaster", boqMasterSchema);