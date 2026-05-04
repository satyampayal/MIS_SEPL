const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },

    billType: {
      type: String,
      // enum: ["RA", "Final", "Credit"],
      required: true
    },
    billTypeCount:{
      type:Number,// RA-01, RA-02
      required:true
    },

    billNumber: {
      type: String, 
      required: true
    },

    billAmount: {
      type: Number,
      required: true
    },

    billDate: {
      type: String,
      required: true
    },

    billFile: String,
    billFilePublicId: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);