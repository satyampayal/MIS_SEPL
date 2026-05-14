const mongoose = require('mongoose');

const masterStoreSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
        unique: true
    },
    storeType: {
        type: String,
        required: true,
        // enum: ['Raw Material', 'Finished Goods', 'Packaging Material', 'Maintenance Supplies', 'Other']
    },
    location: {
        type: String,
        required: true
    },
    storeIncharge: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    storeCode: {
        type: String,
        // required: true
    },
    associtedSite:{
           type:String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MasterStore', masterStoreSchema);