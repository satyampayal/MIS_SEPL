const mongoose = require("mongoose");

const boqDailyPlanItemSchema = new mongoose.Schema(
  {
    boqItemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQItem",
      required: true,
    },

    boqItemCode: String,
    generalName: String,
    description: String,
    uom: String,

    balanceQtyAtPlan: {
      type: Number,
      default: 0,
    },

    targetQty: {
      type: Number,
      required: true,
      min: 0,
    },

    doneQty: {
      type: Number,
      default: 0,
      min: 0,
    },

    installationRate: {
      type: Number,
      default: 0,
    },

    targetValue: {
      type: Number,
      default: 0,
    },

    doneValue: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "DONE"],
      default: "PENDING",
    },

    copiedToMB: {
      type: Boolean,
      default: false,
    },

    mbRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementBook",
      default: null,
    },

    remarks: String,
  },
  { _id: true }
);

const boqDailyPlanSchema = new mongoose.Schema(
  {
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    boqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQMaster",
      required: true,
    },

    planDate: {
      type: Date,
      required: true,
    },

    targetQtyTotal: {
      type: Number,
      default: 0,
    },

    doneQtyTotal: {
      type: Number,
      default: 0,
    },

    targetValueTotal: {
      type: Number,
      default: 0,
    },

    doneValueTotal: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["OPEN", "PARTIAL", "COMPLETED"],
      default: "OPEN",
    },

    items: [boqDailyPlanItemSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

boqDailyPlanSchema.index(
  { projectRef: 1, boqRef: 1, planDate: 1 },
  { unique: true }
);

module.exports = mongoose.model("BOQDailyPlan", boqDailyPlanSchema);