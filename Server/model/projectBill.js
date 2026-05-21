const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMaster",
      required: true,
    },

    billType: {
      type: String,
      enum: ["RA", "Final", "Advance", "Credit Note", "Debit Note"],
      required: true,
    },

    billTypeCount: {
      type: Number,
      default: 1,
    },

    billNumber: {
      type: String,
      required: true,
      trim: true,
    },

    billAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    billDate: {
      type: String,
      required: true,
    },

    receivedAmount: {
      type: Number,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Partial", "Received"],
      default: "Pending",
    },

    billStatus: {
      type: String,
      enum: ["Draft", "Submitted", "Approved", "Rejected"],
      default: "Submitted",
    },

    billFile: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

billSchema.pre("save", function (next) {
  this.pendingAmount = this.billAmount - this.receivedAmount;

  if (this.receivedAmount <= 0) {
    this.paymentStatus = "Pending";
  } else if (this.receivedAmount < this.billAmount) {
    this.paymentStatus = "Partial";
  } else {
    this.paymentStatus = "Received";
    this.pendingAmount = 0;
  }

  next();
});

module.exports = mongoose.model("Bill", billSchema);