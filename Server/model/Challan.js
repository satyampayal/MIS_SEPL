const mongoose = require("mongoose");

const challanItemSchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StoreItem",
      default: null,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    hsnCode: {
      type: String,
      default: "",
      trim: true,
    },

    boqNo: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit: {
      type: String,
      default: "Nos",
      trim: true,
    },

    rate: {
      type: Number,
      default: 0,
    },

    amount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const challanSchema = new mongoose.Schema(
  {
    challanNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    challanType: {
      type: String,
      enum: [
        "Delivery Challan",
        "Material Return",
        "Transfer Challan",
      ],
      default: "Delivery Challan",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    projectName: {
      type: String,
      required: true,
      trim: true,
    },

    site: {
      type: String,
      default: "",
      trim: true,
    },

    consigneeDetails: {
      consigneeName: {
        type: String,
        default: "",
      },

      consigneeAddress: {
        type: String,
        default: "",
      },

      gstNumber: {
        type: String,
        default: "",
      },

      placeOfDelivery: {
        type: String,
        default: "",
      },
    },

    dispatchFrom: {
      type: String,
      enum: ["Office", "Vendor", "Store", "Warehouse", "Other"],
      default: "Office",
    },

    dispatchTo: {
      type: String,
      enum: ["Project Site", "Office", "Vendor", "Store", "Other"],
      default: "Project Site",
    },

    vendorName: {
      type: String,
      default: "",
      trim: true,
    },

    dispatchDate: {
      type: Date,
      required: true,
    },

    transportationMode: {
      type: String,
      default: "",
    },

    transporterName: {
      type: String,
      default: "",
    },

    vehicleNumber: {
      type: String,
      default: "",
    },

    deliveryStatus: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "In Transit",
        "Delivered",
        "Cancelled",
      ],
      default: "Draft",
    },

    items: {
      type: [challanItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "At least one item is required",
      },
    },

    totalQuantity: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    sentBy: {
      type: String,
      default: "",
      trim: true,
    },

    receivedBy: {
      type: String,
      default: "",
      trim: true,
    },

    receivedDate: {
      type: Date,
    },

    signedChallanFile: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dispatchFromStoreRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

challanSchema.pre("save", function (next) {
  this.items = this.items.map((item) => {
    item.amount =
      Number(item.quantity || 0) * Number(item.rate || 0);

    return item;
  });

  this.totalQuantity = this.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  this.totalAmount = this.items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

});

module.exports = mongoose.model("Challan", challanSchema);