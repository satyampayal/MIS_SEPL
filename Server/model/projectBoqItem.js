const mongoose = require("mongoose");

const projectBoqItemSchema = new mongoose.Schema(
    {
        projectRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        itemIdentityRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ItemIdentity",
            required: false,
        },

        group: String,
        activity: String,
        boqSrNo: String,
        slNo: String,
        generalName: String,
        description: String,
        uom: String,

        boqItemCode: {
            type: String,
            default: "",
        },

        boqQty: {
            type: Number,
            default: 0,
        },

        poQty: {
            type: Number,
            default: 0,
        },

        supplyRate: {
            type: Number,
            default: 0,
        },

        installationRate: {
            type: Number,
            default: 0,
        },

        deliveredQty: {
            type: Number,
            default: 0,
        },

        installedQty: {
            type: Number,
            default: 0,
        },

        expectedDeliveryDate: String,

        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium",
        },

        status: {
            type: String,
            enum: [
                "Not Started",
                "In Procurement",
                "Partially Delivered",
                "Fully Delivered",
                "Partially Installed",
                "Installed",
                "Closed",
            ],
            default: "Not Started",
        },

        remarks: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

projectBoqItemSchema.virtual("balanceBoqQty").get(function () {
    return Number(this.boqQty || 0) - Number(this.deliveredQty || 0);
});

projectBoqItemSchema.virtual("balanceToInstall").get(function () {
    return Number(this.deliveredQty || 0) - Number(this.installedQty || 0);
});

projectBoqItemSchema.set("toJSON", { virtuals: true });
projectBoqItemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ProjectBoqItem", projectBoqItemSchema);