const mongoose = require("mongoose");

const projectBillSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    billType: {
      type: String,
    //   enum: ["RA-01", "RA-02", "RA-03", "FINAL", "CREDIT"],
      required: true,
    },

    billAmount: {
      type: Number,
      required: true,
    },

    clearedAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Cleared"],
      default: "Pending",
    },

    billDate: Date,
    clearedDate: Date,

    billCopy: String, // Cloudinary URL

    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectBill", projectBillSchema);