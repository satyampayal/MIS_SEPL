// models/Site.js

const mongoose = require("mongoose");


const contactPersonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    designation: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    contactNumber: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      required: true,
      trim: true
    },
    clientName: {
      type: String,
      required: true,

    },
    orderNumber: {
      type: String,
      // required: true,
      trim: true,
    },
     orderDate: {
      type: String,
      // required: true,
    },
    orderAmount: {
      type: Number,
      // required: true,
    },
    allotedCompany:{
      type:String,
      enum:["Sachin Electrical Private Limited","Sachin Power Projects Private Limited"],  
    },
    typeOfWork: {
      type: String,
      default: "SITC",
    },
    dlpPeriod: {
      type: String,
      default: "1 Year",
    },
    complitionDate:{
      type:String,
    },
    manager: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },


    status: {
      type: String,
      default: "Active",
    },

    progress: {
      type: Number,
      default: 0
    },
    poFile: {
      type: String,
      default: ""
    },

    poFilePublicId: {
      type: String,
      default: ""
    },
    consigneeName:{
      type:String,
      default:""
    },
    consigneeAddress:{
      type:String,
      default:""
    },
    placeOfDelivery:{
      type:String,
      default:""
    },
    gstNumber:{
      type:String,
      default:""
    },
projectContacts: {
  client: [contactPersonSchema],
  project: [contactPersonSchema],
  staff: [contactPersonSchema],
  electrical: [contactPersonSchema],
  helper: [contactPersonSchema],
  fire:[contactPersonSchema],
  contractor:[contactPersonSchema],
  superVisior:[contactPersonSchema],
  hr: [contactPersonSchema],
  accounts: [contactPersonSchema],
  safety: [contactPersonSchema],
  store: [contactPersonSchema]
}
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Project", projectSchema);