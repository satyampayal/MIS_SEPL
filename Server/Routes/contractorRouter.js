const express = require("express");
const contractorRouter = express.Router();

const {
  createContractor,
  getAllContractors,
  updateContractor,
  deleteContractor,
} = require("../controllers/contractorController");

contractorRouter.post("/create", createContractor);
contractorRouter.get("/all", getAllContractors);
contractorRouter.put("/update/:id", updateContractor);
contractorRouter.delete("/delete/:id", deleteContractor);

module.exports = contractorRouter;