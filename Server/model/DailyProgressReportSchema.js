const mongoose = require("mongoose");

const dailyProgressReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false
    },

    projectName: {
      type: String,
      required: true,
      trim: true
    },

    reportDate: {
      type: Date,
      required: true
    },

    workDoneToday: {
      type: String,
      required: true
    },

    manpowerCount: {
      type: Number,
      default: 0
    },

    materialReceived: {
      type: String,
      default: ""
    },

    materialUsed: {
      type: String,
      default: ""
    },

    issuesFaced: {
      type: String,
      default: ""
    },

    tomorrowPlan: {
      type: String,
      default: ""
    },

    siteInchargeName: {
      type: String,
      default: ""
    },

    remarks: {
      type: String,
      default: ""
    },

    photos: [
      {
        url: String,
        publicId: String
      }
    ],

    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: false
    // }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyProgressReport", dailyProgressReportSchema);