const mongoose = require("mongoose");

const challanItemSchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreItem",
      default: null
    },

    itemName: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    hsnCode: {
      type: String,
      trim: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    unit: {
      type: String,
      required: true,
      default: "Nos"
    },

    rate: {
      type: Number,
      default: 0
    },

    amount: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const challanSchema = new mongoose.Schema(
  {
    challanNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    projectName: {
      type: String,
      required: true,
      trim: true
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null
    },

    site: {
      type: String,
      trim: true,
      default: ""
    },

    vendorName: {
      type: String,
      trim: true,
      default: ""
    },

    dispatchFrom: {
      type: String,
      enum: ["Office", "Vendor", "Store", "Warehouse", "Other"],
      required: true,
      default: "Office"
    },

    dispatchTo: {
      type: String,
      enum: ["Project Site", "Office", "Vendor", "Store", "Other"],
      required: true,
      default: "Project Site"
    },

    items: {
      type: [challanItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one item is required"
      }
    },

    totalQuantity: {
      type: Number,
      default: 0
    },

    totalAmount: {
      type: Number,
      default: 0
    },

    dispatchDate: {
      type: Date,
      required: true
    },

    expectedDeliveryDate: {
      type: Date
    },

    deliveryStatus: {
      type: String,
      enum: ["Draft", "Pending", "In Transit", "Delivered", "Cancelled"],
      default: "Draft"
    },

    vehicleNumber: {
      type: String,
      trim: true,
      default: ""
    },

    transporterName: {
      type: String,
      trim: true,
      default: ""
    },

    sentBy: {
      type: String,
      trim: true,
      default: ""
    },

    receivedBy: {
      type: String,
      trim: true,
      default: ""
    },

    receivedDate: {
      type: Date
    },

    signedChallanFile: {
      type: String,
      default: ""
    },

    remarks: {
      type: String,
      trim: true,
      default: ""
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

challanSchema.pre("save", function (next) {
  this.totalQuantity = this.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  this.items = this.items.map((item) => {
    item.amount = Number(item.quantity || 0) * Number(item.rate || 0);
    return item;
  });

  this.totalAmount = this.items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

});

module.exports = mongoose.model("Challan", challanSchema);