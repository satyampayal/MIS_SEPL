// models/Task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    taskType: {
      type: String,
      enum: ["assigned", "personal"],
      default: "personal"
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "hold", "cancelled"],
      default: "pending"
    },

    dueDate: {
      type: Date,
      required: true
    },

    completedAt: Date,

    remarks: {
      type: String,
      trim: true
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        publicId: String
      }
    ],

    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);