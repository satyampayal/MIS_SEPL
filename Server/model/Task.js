// models/Task.js
const mongoose = require("mongoose");

const taskUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "hold", "cancelled", "reopened"],
      required: true
    },

    remarks: {
      type: String,
      trim: true
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

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
      enum: ["assigned", "personal", "project", "department"],
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

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project"
    },

    department: {
      type: String,
      enum: ["Store", "Accounts", "Project", "Billing", "HR", "Admin", "Other"],
      default: "Other"
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium"
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "hold", "cancelled", "reopened"],
      default: "pending"
    },

    dueDate: {
      type: Date,
      required: true
    },

    estimatedHours: {
      type: Number,
      default: 0
    },

    reminderDate: {
      type: Date
    },

    completedAt: Date,

    remarks: {
      type: String,
      trim: true
    },

    progressUpdates: [taskUpdateSchema],

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
    },

    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });

module.exports = mongoose.model("Task", taskSchema);