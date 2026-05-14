const express = require("express");
const userRouter = express.Router();

const {
  registerUser,
  loginUser,
  getAllUsers,
  getParticularUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getMyProfile
} = require("../controllers/userController");

const upload = require("../config/multer");

const {
  isAuthenticated,
  authorizeRoles
} = require("../middleware/auth.midlleware");

// Public
userRouter.post("/register", upload.single("profileImage"), registerUser);
userRouter.post("/login", loginUser);

// Protected
userRouter.get("/me", isAuthenticated, getMyProfile);

userRouter.get(
  "/all",
  isAuthenticated,
  authorizeRoles("Super Admin", "Admin"),
  getAllUsers
);

userRouter.get(
  "/particular/:id",
  isAuthenticated,
  authorizeRoles("Super Admin", "Admin"),
  getParticularUser
);

userRouter.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("Super Admin", "Admin"),
  upload.single("profileImage"),
  updateUser
);

userRouter.patch(
  "/status/:id",
  isAuthenticated,
  authorizeRoles("Super Admin", "Admin"),
  toggleUserStatus
);

userRouter.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("Super Admin"),
  deleteUser
);

module.exports = userRouter;