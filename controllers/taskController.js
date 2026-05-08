// controllers/taskController.js
const Task = require("../model/Task");
const User = require("../model/User");
// const { sendTaskAssignedMail } = require("../services/mailService");

const isAdminRole = (role) => {
  return ["Super Admin", "Admin", "Project Manager"].includes(role);
};

// Super Admin / Admin assign task
exports.createAssignedTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin can assign tasks"
      });
    }

    const user = await User.findById(assignedTo);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found"
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      taskType: "assigned",
      priority,
      dueDate
    });

    // await sendTaskAssignedMail({
    //   to: user.email,
    //   employeeName: user.name,
    //   taskTitle: title,
    //   priority,
    //   dueDate
    // });

    res.status(201).json({
      success: true,
      message: "Task assigned successfully",
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Task assignment failed",
      error: error.message
    });
  }
};

// User creates own personal task
exports.createPersonalTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      assignedTo: req?.user._id,
      assignedBy: req?.user._id,
      taskType: "personal",
      priority,
      dueDate
    });

    res.status(201).json({
      success: true,
      message: "Personal task created",
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Personal task creation failed",
      error: error.message
    });
  }
};

// Logged in user's tasks
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate("assignedBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

// Admin sees all tasks
exports.getAllTasks = async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    const tasks = await Task.find()
      .populate("assignedBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch all tasks",
      error: error.message
    });
  }
};

// User updates status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isOwner = task.assignedTo.toString() === req.user._id.toString();

    if (!isOwner && !isAdminRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to update this task"
      });
    }

    task.status = status || task.status;
    task.remarks = remarks || task.remarks;

    if (status === "completed") {
      task.completedAt = new Date();
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task status updated",
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Status update failed",
      error: error.message
    });
  }
};

// Admin edit task OR personal task owner edit
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isOwner = task.assignedBy.toString() === req.user._id.toString();

    if (!isOwner && !isAdminRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    Object.assign(task, req.body);

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task updated",
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Task update failed",
      error: error.message
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    const isPersonalOwner =
      task.taskType === "personal" &&
      task.assignedBy.toString() === req.user._id.toString();

    if (!isPersonalOwner && !isAdminRole(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Assigned task cannot be deleted by employee"
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Task delete failed",
      error: error.message
    });
  }
};