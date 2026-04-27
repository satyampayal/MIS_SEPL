// models/Site.js

const mongoose = require("mongoose");

const siteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    manager: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    startDate: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "Active"
    },

    progress: {
      type: Number,
      default: 0
    },
    poFileUrl: {
      type: String,
      default: ""
    },

    poFilePublicId: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Site", siteSchema);