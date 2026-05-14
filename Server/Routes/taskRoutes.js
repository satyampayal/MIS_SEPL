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

const { isAuthenticated } = require("../middleware/auth.midlleware");

taskRouter.post("/assign", isAuthenticated, createAssignedTask);
taskRouter.post("/personal", isAuthenticated, createPersonalTask);

taskRouter.get("/my-tasks", isAuthenticated, getMyTasks);
taskRouter.get("/all", isAuthenticated, getAllTasks);

taskRouter.put("/status/:id", isAuthenticated, updateTaskStatus);
taskRouter.put("/:id", isAuthenticated, updateTask);
taskRouter.delete("/:id", isAuthenticated, deleteTask);


// taskRouter.post("/assign", createAssignedTask);
// taskRouter.post("/personal", createPersonalTask);

// taskRouter.get("/my-tasks", getMyTasks);
// taskRouter.get("/all", getAllTasks);

// taskRouter.put("/status/:id", updateTaskStatus);
// taskRouter.put("/:id", updateTask);
// taskRouter.delete("/:id", deleteTask);

module.exports = taskRouter;