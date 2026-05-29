const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");
const cors = require('cors');
const app = express();
const PORT = 5000;
const connectDB = require('./config/db');
const TaxInvoiceRegister = require('./model/taxInvoiceRegisterSchema');
const dotenv = require('dotenv').config();
const Site = require('./model/Project');
const upload = require('./config/multer')
const checkCloudinaryConnection =require('./config/cloudinaryCheck');
const challanRouter = require("./Routes/challanRoutes");
const sroreItemRouter = require("./Routes/sroreItemRoutes");
const storeMasterRouter = require("./Routes/storeMasterRoutes");
const projectMasterRouter = require("./Routes/projectMasterRoutes");
const taxInvoiceRouter = require("./Routes/taxInvoiceRoute");
const dprRouter = require("./Routes/DPRRoutes");
const userRouter = require("./Routes/userRoutes");
const taskRouter = require("./Routes/taskRoutes");
const boqRouter=require('./Routes/boqRoutes')
const partyRouter=require('./Routes/partyMasterRoutes')
const materialMovementRouter=require('./Routes/materialMovementRoutes')
const analyticalRouter=require('./Routes/analyticsRoutes')
const headStoreItemRoutes = require("./Routes/headStoreItemRoutes");
const projectMaterialPlanningRouter=require('./Routes/projectMaterialPlanningRoutes')
// alllow  other Port use server Resources
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mis-sepl.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
  })
);
app.use(express.json());


// User Router
app.use('/user',userRouter)
// Tax Invoice Routes
app.use('/tax-invoice',taxInvoiceRouter);
// task assign or  My task
app.use('/task',taskRouter)
// Party Master Routes
app.use('/party',partyRouter);


/* Start Add Sites */

app.use('/project-master',projectMasterRouter);


/*  Challan start */
app.use('/challan',challanRouter)

/*  Store Routes  */
app.use('/api/store-items',sroreItemRouter)

/* store Master Rotes*/
app.use('/store-master',storeMasterRouter)

// DPR  Router
app.use('/dpr',dprRouter);
// Boq Routes
app.use('/boq',boqRouter);

// Material Movement Routes
app.use("/material-movement", materialMovementRouter);
//Project MaterialPlanning Routes
app.use("/project-material-planning",projectMaterialPlanningRouter)
// All ANalytics
app.use("/analytics", analyticalRouter);
app.use("/head-store", headStoreItemRoutes);
app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Cloudinary Connection Check
checkCloudinaryConnection();
// MongoDB
  connectDB(process.env.MONGO_DB_CONNECTION_URI);
});