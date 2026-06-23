const mongoose = require("mongoose");

const boqAliasSchema = new mongoose.Schema(
  {
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

    aliasText: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    source: {
      type: String,
      enum: ["MANUAL", "DPR_LINKING", "IMPORT"],
      default: "MANUAL",
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      default: null,
    },
  },
  { timestamps: true }
);

boqAliasSchema.index(
  { projectRef: 1, boqItemRef: 1, aliasText: 1 },
  { unique: true }
);

module.exports = mongoose.model("BOQAlias", boqAliasSchema);