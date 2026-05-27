// routes/taskRoutes.js
const express = require("express");
const taskRouter = express.Router();

const {
  assignTask,
  createPersonalTask,
  getMyTasks,
  getAllTasks,
  updateTaskStatus,
  deleteTask,
  getAssignedByMeTasks
} = require("../controllers/taskController");

const { isAuthenticated } = require("../middleware/auth.midlleware");

// create
taskRouter.post("/assign", isAuthenticated, assignTask);
taskRouter.post("/personal", isAuthenticated, createPersonalTask);

// read
taskRouter.get("/my-tasks", isAuthenticated, getMyTasks);
taskRouter.get("/all", isAuthenticated, getAllTasks);

// update
taskRouter.patch("/status/:id", isAuthenticated, updateTaskStatus);

// delete
taskRouter.delete("/delete/:id", isAuthenticated, deleteTask);

// Asigned by Me
taskRouter.get(
  "/assigned-by-me",
  isAuthenticated,
  getAssignedByMeTasks
);

module.exports = taskRouter;