const mongoose = require("mongoose");

const dailyProgressReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    reportDate: {
      type: Date,
      required: true,
    },

    // ===== OLD DPR FIELDS =====

    workDoneToday: {
      type: String,
      default: "",
    },

    manpowerCount: {
      type: Number,
      default: 0,
    },

    materialReceived: {
      type: String,
      default: "",
    },

    materialUsed: {
      type: String,
      default: "",
    },

    issuesFaced: {
      type: String,
      default: "",
    },

    tomorrowPlan: {
      type: String,
      default: "",
    },

    siteInchargeName: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    // ===== NEW MEASUREMENT ITEMS =====

    workItems: [
      {
        boqItemRef: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BOQItem",
          default: null,
        },

        boqItemCode: {
          type: String,
          default: "",
        },

        generalName: {
          type: String,
          default: "",
        },

        description: {
          type: String,
          default: "",
        },

        uom: {
          type: String,
          default: "",
        },

        todayQty: {
          type: Number,
          default: 0,
        },

        rate: {
          type: Number,
          default: 0,
        },

        amount: {
          type: Number,
          default: 0,
        },

        workType: {
          type: String,
          enum: ["INSTALLATION", "SUPPLY", "LABOUR"],
          default: "INSTALLATION",
        },

        remarks: {
          type: String,
          default: "",
        },
      },
    ],

    // ===== PHOTOS =====

    photos: [
      {
        url: String,
        publicId: String,
      },
    ],

    // ===== STATUS =====

    status: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DailyProgressReport",
  dailyProgressReportSchema
);