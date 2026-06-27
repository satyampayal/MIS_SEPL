const express = require("express");
const {
  createOrUpdateDailyPlan,
  getDailyPlan,
  updatePlanItemDoneQty,
  removePlanItem,
  getPlansReadyForMB,
markPlanItemsCopiedToMB,
} = require("../controllers/boqDailyPlanController");

const {  isAuthenticated } = require("../middleware/auth.midlleware");

const router = express.Router();

router.post("/save", isAuthenticated, createOrUpdateDailyPlan);
router.get("/", isAuthenticated, getDailyPlan);
router.put("/:planId/item/:itemId/done", isAuthenticated, updatePlanItemDoneQty);
router.delete("/:planId/item/:itemId", isAuthenticated, removePlanItem);
router.get("/ready-for-mb", isAuthenticated, getPlansReadyForMB);

router.put(
  "/:planId/mark-copied-to-mb",
  isAuthenticated,
  markPlanItemsCopiedToMB
);

module.exports = router;