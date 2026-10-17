
const express = require("express");
const workPlanRouter = express.Router();

const workPlanController = require("../controllers/workPlanController");
const workPlanDailyTarget = require("../controllers/workPlanDailyTargetController")
// Add your existing authentication and permission middleware
// to these routes, matching your application's conventions.
const {isAuthenticated} = require("../middleware/auth.midlleware")
workPlanRouter.post("/",isAuthenticated, workPlanController.createWorkPlan);

workPlanRouter.get("/",isAuthenticated, workPlanController.getWorkPlans);

workPlanRouter.get(
    "/report/monthly",
    isAuthenticated,
    workPlanController.getMonthlyWorkPlanReport
);

workPlanRouter.get("/:id",isAuthenticated, workPlanController.getWorkPlanById);

workPlanRouter.put("/:id",isAuthenticated, workPlanController.updateWorkPlan);

workPlanRouter.patch(
    "/:id/submit",
    isAuthenticated,
    workPlanController.submitWorkPlan
);

workPlanRouter.patch(
    "/:id/review",
    isAuthenticated,
    workPlanController.reviewWorkPlan
);

// for daily work plan controller 
workPlanRouter.get(
    "/:id/daily-targets",
    isAuthenticated,
    workPlanDailyTarget.getDailyTargets
);

workPlanRouter.put(
    "/:id/daily-targets",
    isAuthenticated,
    workPlanDailyTarget.saveDailyTargets
);

module.exports = workPlanRouter;
