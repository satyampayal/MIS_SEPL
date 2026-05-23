const mongoose = require("mongoose");

const materialMovementSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true, index: true },

    uom: { type: String, default: "", trim: true },
    quantity: { type: Number, default: 0 },
    hsnCode: { type: String, default: "", trim: true },
    boqNo: { type: String, default: "", trim: true },

    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },

    storeItemCode: { type: String, default: "", trim: true, index: true },
    typeOfTransit: {
      type: String,
      enum: ["In", "Out", "Return", "Transfer", "DDC","DC","LPN","MRN"],
      default: "",
    },

    materialInwardFor: { type: String, default: "", trim: true },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectMaster",
      default: null,
      index: true,
    },

    projectName: { type: String, default: "", trim: true, index: true },
    projectCode: { type: String, default: "", trim: true },

    documentNo: { type: String, default: "", trim: true, index: true },
    documentDate: { type: Date, default: null, index: true },
    documentName: { type: String, default: "", trim: true },

    vendorName: { type: String, default: "", trim: true, index: true },
    vendorPONumber: { type: String, default: "", trim: true },

    invoiceNumber: { type: String, default: "", trim: true, index: true },
    invoiceDate: { type: Date, default: null },

    transportName: { type: String, default: "", trim: true },
    vehicleNumber: { type: String, default: "", trim: true },

    concernedPersonAtSite: { type: String, default: "", trim: true },
    materialReturnedFromSite: { type: String, default: "", trim: true },

    companyName: { type: String, default: "", trim: true },
    brandMake: { type: String, default: "", trim: true },
    model: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    commodity: { type: String, default: "", trim: true },
    mepHead: { type: String, default: "", trim: true },

    installationActivity: { type: String, default: "", trim: true },
    primarySecondaryUOM: { type: String, default: "", trim: true },
    multiplicationFactor: { type: Number, default: 1 },

    minimumStockLevel: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    openingStock: { type: Number, default: 0 },
    storageLocation: { type: String, default: "", trim: true },

    dateOfRegistration: { type: Date, default: null },
    itemImageHyperlink: { type: String, default: "" },
    registeredItem: {
      type: String,
      enum: ["Y", "N", ""],
      default: "",
    },

    itemProjectSite: { type: String, default: "", trim: true },
    consigneeName: { type: String, default: "", trim: true },
    consigneeAddress: { type: String, default: "", trim: true },

    datePunchTime: { type: Date, default: Date.now },

    inOut: {
      type: String,
      enum: ["In", "Out", ""],
      default: "",
      index: true,
    },

    remarks: { type: String, default: "", trim: true },

    sourceModule: {
      type: String,
      enum: ["Challan", "TaxInvoice", "ExcelUpload", "Manual"],
      default: "Manual",
    },

    sourceRef: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

materialMovementSchema.index({
  itemName: "text",
  projectName: "text",
  vendorName: "text",
  documentNo: "text",
  invoiceNumber: "text",
  storeItemCode: "text",
});

module.exports = mongoose.model("MaterialMovement", materialMovementSchema);