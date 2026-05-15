const mongoose = require("mongoose");

const partyMasterSchema = new mongoose.Schema(
  {
    partyName: {
      type: String,
      required: true,
      trim: true,
    },

    partyType: {
      type: String,
      enum: ["Vendor", "Supplier", "Contractor", "Client", "Company", "Other"],
      default: "Vendor",
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    contactNumber: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    city: String,
    state: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

partyMasterSchema.index({ partyName: 1, gstNumber: 1 }, { unique: true });

module.exports = mongoose.model("PartyMaster", partyMasterSchema);