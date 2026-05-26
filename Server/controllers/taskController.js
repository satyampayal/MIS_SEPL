// controllers/taskController.js
const Task = require("../model/Task");

// ADMIN: assign task
exports.assignTask = async (req, res) => {
  try {

    const {
      title,
      description,
      assignedTo,
      project,
      department,
      priority,
      dueDate,
      estimatedHours,
      reminderDate
    } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, assigned user and due date are required"
      });
    }
    const canAssign = ["Super Admin", "Admin", "Manager"].includes(req.user.role);

if (!canAssign) {
  return res.status(403).json({
    success: false,
    message: "You are not allowed to assign tasks"
  });
}

    const task = await Task.create({
      title,
      description,
      taskType: project ? "project" : "assigned",
      assignedBy: req.user._id,
      assignedTo,
      project: project || null,
      department: department || "Other",
      priority: priority || "medium",
      dueDate,
      estimatedHours: estimatedHours || 0,
      reminderDate: reminderDate || null,
      progressUpdates: [
        {
          status: "pending",
          remarks: "Task assigned",
          updatedBy: req.user._id
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task
    });
  } catch (error) {
    console.error("Assign Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign task"
    });
  }
};

// USER: create own task
exports.createPersonalTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      department,
      priority,
      dueDate,
      estimatedHours,
      reminderDate
    } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and due date are required"
      });
    }

    const task = await Task.create({
      title,
      description,
      taskType: "personal",
      assignedBy: req.user._id,
      assignedTo: req.user._id,
      project: project || null,
      department: department || "Other",
      priority: priority || "medium",
      dueDate,
      estimatedHours: estimatedHours || 0,
      reminderDate: reminderDate || null,
      progressUpdates: [
        {
          status: "pending",
          remarks: "Personal task created",
          updatedBy: req.user._id
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Personal task created",
      task
    });
  } catch (error) {
    console.error("Create Personal Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create personal task"
    });
  }
};

// USER: my tasks
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.user._id,
      isDeleted: false
    })
      .populate("assignedBy", "fullName name email role")
      .populate("assignedTo", "fullName name email role")
      .populate("project", "projectName siteName name")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get My Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch my tasks"
    });
  }
};

// ADMIN: all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isDeleted: false })
      .populate("assignedBy", "fullName name email role")
      .populate("assignedTo", "fullName name email role")
      .populate("project", "projectName siteName name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Get All Tasks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all tasks"
    });
  }
};

// USER: update status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const allowedStatus = [
      "pending",
      "in_progress",
      "completed",
      "hold",
      "cancelled",
      "reopened"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status"
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isAssignedUser =
      task.assignedTo.toString() === req.user._id.toString();

    const isCreator =
      task.assignedBy?.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "Admin"].includes(req.user.role);

    if (!isAssignedUser && !isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task"
      });
    }

    task.status = status;
    task.remarks = remarks || task.remarks;

    if (status === "completed") {
      task.completedAt = new Date();
    }

    if (status !== "completed") {
      task.completedAt = null;
    }

    task.progressUpdates.push({
      status,
      remarks,
      updatedBy: req.user._id
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task status updated",
      task
    });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task"
    });
  }
};

// soft delete
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isCreator =
      task.assignedBy?.toString() === req.user._id.toString();

    const isAdmin = ["Super Admin", "Admin"].includes(req.user.role);

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this task"
      });
    }

    task.isDeleted = true;
    await task.save();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task"
    });
  }
};