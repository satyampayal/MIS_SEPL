const mongoose = require("mongoose");

const procurementPlanSchema = new mongoose.Schema(
    {
        procurementNumber: {
            type: String,
            unique: true,
            required: true,
        },

        materialRequisitionRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MaterialRequisition",
            required: true,
        },

        projectRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        executionStatus: {
            type: String,
            enum: ["PENDING", "CHALLAN_CREATED", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },

        challanRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Challan",
            default: null,
        },

        challanNumber: {
            type: String,
            default: "",
        },

        challanCreatedAt: {
            type: Date,
            default: null,
        },

        items: [
            {
                itemRef: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ItemIdentity",
                    required: true,
                },

                itemName: String,
                itemCode: String,
                unit: String,

                requiredQty: {
                    type: Number,
                    default: 0,
                },

                availableQty: {
                    type: Number,
                    default: 0,
                },

                shortageQty: {
                    type: Number,
                    required: true,
                },

                procurementMode: {
                    type: String,
                    enum: ["MRN", "DDC", "LPN", "ISTN"],
                    default: "MRN",
                },

                suggestedVendor: {
                    type: String,
                    default: "",
                },

                lastPurchaseRate: {
                    type: Number,
                    default: 0,
                },

                remarks: {
                    type: String,
                    default: "",
                },
            },
        ],

        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },


    },
    { timestamps: true }
);

module.exports = mongoose.model("ProcurementPlan", procurementPlanSchema);