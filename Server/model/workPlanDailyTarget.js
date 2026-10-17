
const mongoose = require("mongoose");

const workPlanDailyTargetSchema = new mongoose.Schema(
    {
        workPlanRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkPlan",
            required: true,
            index: true,
        },

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

        targetDate: {
            type: Date,
            required: true,
            index: true,
        },

        targetQty: {
            type: Number,
            required: true,
            min: 0,
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

workPlanDailyTargetSchema.index(
    {
        workPlanRef: 1,
        boqItemRef: 1,
        targetDate: 1,
    },
    { unique: true }
);

module.exports = mongoose.model(
    "WorkPlanDailyTarget",
    workPlanDailyTargetSchema
);
