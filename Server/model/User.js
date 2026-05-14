const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    mobileNumber: {
      type: String,
      default: ""
    },

    employeeId: {
      type: String,
      default: ""
    },

    department: {
      type: String,
      enum: [
        "MIS",
        "Electrical",
        "HVAC",
        "Plumbing",
        "Fire Fighting",
        "Accounts",
        "Store",
        "Admin",
        "Management"
      ],
      default: "MIS"
    },

    designation: {
      type: String,
      default: ""
    },

    role: {
      type: String,
      enum: [
        "Super Admin",
        "Admin",
        "Project Manager",
        "Site Engineer",
        "Store Manager",
        "MIS User",
        "Accountant"
      ],
      default: "MIS User"
    },

    assignedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
      }
    ],

    profileImage: {
      url: {
        type: String,
        default: ""
      },

      publicId: {
        type: String,
        default: ""
      }
    },

    address: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date
    },

    loginHistory: [
      {
        loginTime: Date,
        ipAddress: String,
        device: String
      }
    ]
  },
  { timestamps: true }
);


// ================= PASSWORD HASH =================

userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    // return next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);

  // next();
});


// ================= JWT TOKEN =================

userSchema.methods.generateToken = function () {

  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
      email: this.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};


// ================= PASSWORD COMPARE =================

userSchema.methods.comparePassword = async function (enteredPassword) {

  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);