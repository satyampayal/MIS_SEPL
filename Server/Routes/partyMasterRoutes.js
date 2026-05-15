const express = require("express");
const partyRouter = express.Router();

const {
  createParty,
  getAllParties,
  getPartyById,
  updateParty,
  deleteParty,
  searchParties,
} = require("../controllers/partyMasterController");

partyRouter.post("/create", createParty);

partyRouter.get("/all", getAllParties);

partyRouter.get("/search", searchParties);

partyRouter.get("/:id", getPartyById);

partyRouter.put("/update/:id", updateParty);

partyRouter.delete("/delete/:id", deleteParty);

module.exports = partyRouter;