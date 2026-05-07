// routes/taskRoutes.js
const express = require("express");
const taskRouter = express.Router();

const {
  createAssignedTask,
  createPersonalTask,
  getMyTasks,
  getAllTasks,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require("../controllers/taskController");

// const { protect } = require("../middlewares/authMiddleware");

// taskRouter.post("/assign", protect, createAssignedTask);
// taskRouter.post("/personal", protect, createPersonalTask);

// taskRouter.get("/my-tasks", protect, getMyTasks);
// taskRouter.get("/all", protect, getAllTasks);

// taskRouter.put("/status/:id", protect, updateTaskStatus);
// taskRouter.put("/:id", updateTask);
// taskRouter.delete("/:id", deleteTask);


module.exports = taskRouter;