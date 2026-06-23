const mongoose = require("mongoose");

const dprMaterialSchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemIdentity",
      default: null,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    itemCode: {
      type: String,
      default: "",
      trim: true,
    },

    uom: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    source: {
      type: String,
      enum: ["MAIN_STORE", "LOCAL_PURCHASE", "SITE_TRANSFER", "SITE_STOCK","OTHER"],
      default: "OTHER",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const dprManpowerSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "",
      trim: true,
    },

    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const dprPhotoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },

    publicId: {
      type: String,
      default: "",
    },

    caption: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const dailyProgressReportSchema = new mongoose.Schema(
  {
    dprNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
      index: true,
    },

    contractorName: {
      type: String,
      default: "",
      trim: true,
    },

    reportDate: {
      type: Date,
      required: true,
      index: true,
    },

    siteInchargeName: {
      type: String,
      default: "",
      trim: true,
    },

    weather: {
      type: String,
      enum: ["CLEAR", "CLOUDY", "RAINY", "HOT", "OTHER"],
      default: "CLEAR",
    },

    manpowerCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    manpowerDetails: [dprManpowerSchema],

    workDoneToday: {
      type: String,
      required: true,
      trim: true,
    },

    materialReceived: [dprMaterialSchema],

    materialUsed: [dprMaterialSchema],

    visitors: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    photos: [dprPhotoSchema],

    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "VERIFIED", "REJECTED"],
      default: "SUBMITTED",
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
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
  { timestamps: true }
);

dailyProgressReportSchema.index({
  projectRef: 1,
  reportDate: 1,
});

module.exports = mongoose.model(
  "DailyProgressReport",
  dailyProgressReportSchema
);