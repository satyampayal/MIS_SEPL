const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
{
    storeItemCode: {
        type: String,
        required: true,
        unique: true
    },

    itemName: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    unit: {
        type: String,
        required: true
    },

    openingStock: {
        type: Number,
        required: true,
        default: 0
    },

    currentStock: {
        type: Number,
        required: true,
        default: 0
    },

    minimumStock: {
        type: Number,
        required: true,
        default: 0
    },

    rate: {
        type: Number,
        default: 0
    },

    location: {
        type: String,
        default: ""
    },

    remarks: {
        type: String,
        default: ""
    },

    hsnCode: {
        type: String,
        default: ""
    },

    commodity: {
        type: String,
        default: ""
    },

    mepHead: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Store", storeSchema);