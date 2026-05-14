const User = require("../model/User");

// REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobileNumber,
      employeeId,
      department,
      designation,
      role,
      assignedProjects
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const profileImage = req.file
      ? {
          url: req.file.path,
          publicId: req.file.filename
        }
      : undefined;

    const user = await User.create({
      fullName,
      email,
      password,
      mobileNumber,
      employeeId,
      department,
      designation,
      role,
      assignedProjects,
      profileImage
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user
    });
  } catch (error) {
    console.log("Register User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
      error: error.message
    });
  }
};

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = user.generateToken();

    user.lastLogin = new Date();

    user.loginHistory.push({
      loginTime: new Date(),
      ipAddress: req.ip,
      device: req.headers["user-agent"]
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.log("Login User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while login",
      error: error.message
    });
  }
};

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
    //   .populate("assignedProjects")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: users.length,
      users
    });
  } catch (error) {
    console.log("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching users",
      error: error.message
    });
  }
};

// GET PARTICULAR USER
exports.getParticularUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .populate("assignedProjects");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.log("Get Particular User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user",
      error: error.message
    });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updatedData = { ...req.body };

    if (req.file) {
      updatedData.profileImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    delete updatedData.password;

    const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.log("Update User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating user",
      error: error.message
    });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.log("Delete User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message
    });
  }
};

// ACTIVE / INACTIVE USER
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      isActive: user.isActive
    });
  } catch (error) {
    console.log("Toggle User Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while changing user status",
      error: error.message
    });
  }
};

// MY PROFILE
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("assignedProjects");

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.log("Get My Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message
    });
  }
};