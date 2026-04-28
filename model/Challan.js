const mongoose = require("mongoose");

const challanSchema = new mongoose.Schema(
{
    challanNumber: {
        type: String,
        required: true,
        unique: true
    },

    site: {
        type: String,
        required: true
    },

    vendorName: {
        type: String,
        required: true
    },

    itemDescription: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    dispatchDate: {
        type: Date,
        required: true
    },

    deliveryStatus: {
        type: String,
        enum: ["Pending", "In Transit", "Delivered", "Cancelled"],
        default: "Pending"
    },

    challanFile: {
        type: String
    },

    remarks: {
        type: String
    },

    sentBy: {
        type: String
    },

    receivedBy: {
        type: String
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Challan", challanSchema);