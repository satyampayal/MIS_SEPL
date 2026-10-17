
const mongoose = require("mongoose");

const workPlanItemSchema = new mongoose.Schema(
    {
        boqItemRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BOQItem",
            required: true,
        },

        planQty: {
            type: Number,
            required: true,
            min: 0,
        },

        // Optional snapshot of the BOQ item at plan creation
        description: {
            type: String,
            trim: true,
            default: "",
        },

        unit: {
            type: String,
            trim: true,
            default: "",
        },

        rate: {
            type: Number,
            default: 0,
            min: 0,
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: true }
);

const workPlanSchema = new mongoose.Schema(
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

        planName: {
            type: String,
            trim: true,
            default: "",
        },

        planNumber: {
            type: String,
            trim: true,
            required: true,
            unique: true,
        },

        planStartDate: {
            type: Date,
            required: true,
        },

        planEndDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return !this.planStartDate ||
                        value >= this.planStartDate;
                },
                message: "Plan end date must be on or after start date.",
            },
        },

        planDescription: {
            type: String,
            trim: true,
            default: "",
        },

        planItemList: {
            type: [workPlanItemSchema],
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "At least one BOQ item is required.",
            },
        },

        status: {
            type: String,
            enum: [
                "DRAFT",
                "SUBMITTED",
                "APPROVED",
                "REJECTED",
                "REVISION_REQUESTED",
                "CLOSED",
            ],
            default: "DRAFT",
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        submittedAt: {
            type: Date,
            default: null,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        reviewRemarks: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

workPlanSchema.index({
    projectRef: 1,
    planStartDate: 1,
    planEndDate: 1,
});

module.exports = mongoose.model("WorkPlan", workPlanSchema);
