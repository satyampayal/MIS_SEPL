const mongoose = require("mongoose");

const challanItemSchema = new mongoose.Schema(
  {
    itemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemIdentity",
      required: true,
    },

    fromStockRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MainStoreStock",
      default: null,
    },

    toStockRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SiteStoreStock",
      default: null,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    itemCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    unit: {
      type: String,
      default: "Nos",
      trim: true,
    },

    hsnCode: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    amount: {
      type: Number,
      default: 0,
    },
    itemPurpose: {
      type: String,
      enum: ["BOQ_INSTALLATION", "CONSUMABLE", "TOOL", "SAFETY", "TEMPORARY_USE", "OTHER"],
      default: "BOQ_INSTALLATION",
    },
    boqItemRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectBoqItem",
      default: null,
    },

    boqRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BOQMaster",
      default: null,
    },
    boqQty: {
      type: Number,
      default: 0,
    },

    alreadyIssuedQty: {
      type: Number,
      default: 0,
    },

    remainingBoqQty: {
      type: Number,
      default: 0,
    },
    isReturnable: {
      type: Boolean,
      default: false,
    },

    expectedReturnDate: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);



const challanSchema = new mongoose.Schema(
  {
    documentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    documentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    documentType: {
      type: String,
      enum: ["DDC", "ISTN", "DC", "LPN", "MRN", "MRS", "CN"],
      required: true,
    },

    sourceType: {
      type: String,
      enum: ["MAIN_STORE", "SITE_STORE", "VENDOR", "OTHER"],
      required: true,
    },

    destinationType: {
      type: String,
      enum: ["MAIN_STORE", "SITE_STORE", "VENDOR", "OTHER"],
      required: true,
    },

    stockImpact: {
      type: String,
      enum: [
        "NO_STOCK_EFFECT",
        "RESERVE_MAIN_STORE",
        "RESERVE_SITE_STORE",
        "INCREASE_MAIN_STORE",
        "INCREASE_SITE_STORE",
        "TRANSFER_MAIN_TO_SITE",
        "TRANSFER_SITE_TO_MAIN",
        "TRANSFER_SITE_TO_SITE",
        "RETURN_TO_VENDOR",
      ],
      required: true,
    },

    fromMainStoreRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      default: null,
    },

    toMainStoreRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MasterStore",
      default: null,
    },

    fromSiteRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    toSiteRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    vendorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartyMaster",
      default: null,
    },

    vendorName: {
      type: String,
      default: "",
      trim: true,
    },

    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    projectName: {
      type: String,
      default: "",
      trim: true,
    },

    items: {
      type: [challanItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
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

    stockStatus: {
      type: String,
      enum: [
        "NOT_APPLIED",
        "RESERVED",
        "UPDATED",
        "RELEASED",
        "FAILED",
      ],
      default: "NOT_APPLIED",
    },

    deliveryStatus: {
      type: String,
      enum: [
        "PENDING",
        "IN_TRANSIT",
        "RECEIVED_AT_SITE",
        "RECEIVED_AT_STORE",
        "RETURNED",
        "CANCELLED",
      ],
      default: "PENDING",
    },


    materialRequisitionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MaterialRequisition",
      default: null,
    },
    procurementPlanRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcurementPlan",
      default: null,
    },
    procurementItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    procurementItemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    siteApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    siteApprovedAt: {
      type: Date,
      default: null,
    },
    approvalStatus: {
      type: String,
      enum: [
        "PENDING_SITE_APPROVAL",
        "CORRECTION_REQUESTED",
        "APPROVED_BY_SITE",
        "REJECTED_BY_SITE",
      ],
      default: "PENDING_SITE_APPROVAL",
    },

    correctionReason: {
      type: String,
      default: "",
    },

    correctionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    correctionRequestedAt: {
      type: Date,
      default: null,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    challanFile: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

challanSchema.pre("validate", function (next) {
  const rules = {
    DC: {
      sourceType: "MAIN_STORE",
      destinationType: "SITE_STORE",
      stockImpact: "TRANSFER_MAIN_TO_SITE",
    },
    DDC: {
      sourceType: "VENDOR",
      destinationType: "SITE_STORE",
      stockImpact: "INCREASE_SITE_STORE",
    },
    LPN: {
      sourceType: "VENDOR",
      destinationType: "SITE_STORE",
      stockImpact: "INCREASE_SITE_STORE",
    },
    ISTN: {
      sourceType: "SITE_STORE",
      destinationType: "SITE_STORE",
      stockImpact: "TRANSFER_SITE_TO_SITE",
    },
    MRN: {
      sourceType: "VENDOR",
      destinationType: "MAIN_STORE",
      stockImpact: "INCREASE_MAIN_STORE",
    },
    MRS: {
      sourceType: "SITE_STORE",
      destinationType: "MAIN_STORE",
      stockImpact: "TRANSFER_SITE_TO_MAIN",
    },
    CN: {
      sourceType: "MAIN_STORE",
      destinationType: "VENDOR",
      stockImpact: "RETURN_TO_VENDOR",
    },
  };

  const rule = rules[this.documentType];

  if (rule) {
    this.sourceType = rule.sourceType;
    this.destinationType = rule.destinationType;
    this.stockImpact = rule.stockImpact;
  }

  // next();
});

challanItemSchema.pre("validate", function (next) {
  if (this.itemPurpose === "BOQ_INSTALLATION") {
    if (!this.boqItemRef || !this.boqRef) {
      return next(
        new Error("BOQ item and BOQ reference are required for BOQ installation material")
      );
    }
  }

  if (this.itemPurpose === "TOOL") {
    this.isReturnable = true;
  }

  // next();
});

challanSchema.pre("save", function (next) {
  this.totalQuantity = this.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  this.totalAmount = this.items.reduce((sum, item) => {
    item.amount = Number(item.quantity || 0) * Number(item.rate || 0);
    return sum + Number(item.amount || 0);
  }, 0);

  // next();
});

// challanSchema.index({ documentNumber: 1 }, { unique: true });
challanSchema.index({ documentType: 1 });
challanSchema.index({ approvalStatus: 1 });
challanSchema.index({ stockStatus: 1 });
challanSchema.index({ fromMainStoreRef: 1 });
challanSchema.index({ toSiteRef: 1 });
challanSchema.index({ projectRef: 1 });

module.exports = mongoose.model("Challan", challanSchema);