const mongoose = require("mongoose");

const measurementBookEntrySchema = new mongoose.Schema(
  {
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    boqItemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQItem",
      required: true,
      index: true,
    },

    contractorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contractor",
      default: null,
      index: true,
    },

    dprRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DPR",
      default: null,
    },

    measurementDate: {
      type: Date,
      required: true,
      index: true,
    },

    executedByType: {
      type: String,
      enum: ["SEPL", "CONTRACTOR"],
      required: true,
      index: true,
    },

    previousQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    todayQty: {
      type: Number,
      required: true,
      min: 0,
    },

    totalQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    uom: {
      type: String,
      default: "",
      trim: true,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      default: 0,
      min: 0,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    floor: {
      type: String,
      default: "",
      trim: true,
    },

    area: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    approvalStatus: {
      type: String,
      enum: ["DRAFT", "PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "DRAFT",
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    billStatus: {
      type: String,
      enum: ["NOT_BILLABLE", "UNBILLED", "BILLED"],
      default: "UNBILLED",
      index: true,
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

measurementBookEntrySchema.pre("save", function () {
  this.totalQty = Number(this.previousQty || 0) + Number(this.todayQty || 0);

  this.balanceQty = Math.max(
    Number(this.balanceQty || 0),
    0
  );

  if (this.executedByType === "SEPL") {
    this.rate = this.rate;
    this.amount = Number(this.todayQty || 0) * Number(this.rate || 0);
    this.billStatus = "NOT_BILLABLE";
    this.contractorRef = null;
  } else {
    this.amount = Number(this.todayQty || 0) * Number(this.rate || 0);
    if (this.billStatus === "NOT_BILLABLE") {
      this.billStatus = "UNBILLED";
    }
  }

//   next();
});

measurementBookEntrySchema.index({
  projectRef: 1,
  boqItemRef: 1,
  measurementDate: 1,
  approvalStatus: 1,
});

module.exports = mongoose.model(
  "MeasurementBookEntry",
  measurementBookEntrySchema
);