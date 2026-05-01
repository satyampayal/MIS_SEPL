const TaxInvoice = require('../model/taxInvoiceRegisterSchema');

// exports.uploadTaxInvoiceExcel=async (req,res)=>{

// Get Tax Invoice All
exports.getAllTaxInvoie = async (req, res) => {
    try {
        const total = await TaxInvoice.countDocuments();
        const taxInvoiceList = await TaxInvoice.find();

        // console.log(taxInvoiceList);
        res.status(200).json({
            message: "Total Tax Invoice Register in DB",
            total: total,
            taxInvoiceList: taxInvoiceList
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }

}

//get by Id
exports.getById = async (req, res) => {
    try {
        const { taxInvoiceId } = req.params;

        if (!taxInvoiceId) {
            return res.status(400).json({
                message: "Tax Invoice ID is required",
            });
        }

        // Find single invoice by MongoDB _id
        const invoice = await TaxInvoice.findById(taxInvoiceId);

        if (!invoice) {
            return res.status(404).json({
                message: "Tax Invoice not found",
            });
        }

        res.status(200).json({
            message: "Tax Invoice fetched successfully 🚀",
            data: invoice,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }
}

// Create Tax Invoice 
exports.register = async (req, res) => {
    try {
        const {
            invoiceDate,
            invoiceNumber,
            invoiceAmount,
            vendorName,
            projectSite,
            challanCreated,
            challanNumber,
            challanDate,
            deliveryStatus,
            quantitySent,
            quantityReceived,
            itemDetailsRequired,
        } = req.body;

        // 📂 Files
        const invoiceFileObj = req.files.find(f => f.fieldname === "invoiceFile");
        const challanFileObj = req.files.find(f => f.fieldname === "challanFile");

        const invoiceFile = invoiceFileObj ? invoiceFileObj.path : null;
        const challanFile = challanFileObj ? challanFileObj.path : null;

        // 🧪 Debug once
        console.log("invoiceFile:", invoiceFile);

        // 📦 Material Difference
        let materialDifference = "No Difference";

        if (
            quantitySent &&
            quantityReceived &&
            Number(quantitySent) !== Number(quantityReceived)
        ) {
            materialDifference = "Difference Found";
        }

        // 🔍 Check existing
        const existingInvoice = await TaxInvoice.findOne({
            invoiceNumber: invoiceNumber.trim(),
            projectSite: projectSite?.trim(),
            vendorName: vendorName?.trim()
        });

        if (existingInvoice) {
            return res.status(200).json({
                success: true,
                message: "Invoice already exists ⚠️",
                data: existingInvoice
            });
        }

        // 🆕 Create new (IMPORTANT FIX HERE)
        const newInvoice = new TaxInvoice({
            invoiceDate,
            invoiceNumber,
            invoiceAmount,
            vendorName,
            projectSite,
            challanCreated,
            challanNumber,
            challanDate,
            deliveryStatus,
            quantitySent,
            quantityReceived,
            itemDetailsRequired,
            materialDifference,

            // ✅ SAVE FILES
            invoiceFile,
            challanFile
        });

        await newInvoice.save();

        return res.status(201).json({
            success: true,
            message: "New invoice created successfully 🚀",
            data: newInvoice
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};