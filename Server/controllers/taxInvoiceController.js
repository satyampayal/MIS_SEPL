const TaxInvoice = require('../model/taxInvoiceRegisterSchema');
const ExcelJS = require("exceljs");
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
            remarks
        } = req.body;

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
            invoiceFile: req.files?.invoiceFile?.[0]?.path,
            challanFile: req.files?.challanFile?.[0]?.path
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

// Bulk Invoice Register Through Excel 
exports.bulkInvoiceRegister = async (req, res) => {
    try {
        const invoices = req.body;

        if (!Array.isArray(invoices) || invoices.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please send an array of invoice data",
            });
        }

        const validInvoices = [];
        const duplicateInvoices = [];

        for (const invoice of invoices) {
            const invoiceNumber = String(invoice.invoiceNumber || "").trim();
            const vendorName = String(invoice.vendorName || "").trim();
            const projectSite = String(invoice.projectSite || "").trim();
            const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
            const challanDate = invoice.challanDate ? new Date(invoice.challanDate) : null;

            if (!invoiceNumber || !vendorName || !projectSite) {
                duplicateInvoices.push({
                    ...invoice,
                    reason: "Missing invoiceNumber, vendorName or projectSite",
                });
                continue;
            }

            const alreadyExists = await TaxInvoice.findOne({
                invoiceNumber,
                vendorName,
                projectSite,
            });

            if (alreadyExists) {
                duplicateInvoices.push({
                    ...invoice,
                    reason: "Already exists in database",
                });
            } else {
                let materialDifference = "No Difference";

                if (
                    invoice.quantitySent &&
                    invoice.quantityReceived &&
                    Number(invoice.quantitySent) !== Number(invoice.quantityReceived)
                ) {
                    materialDifference = "Difference Found";
                }

                validInvoices.push({
                    ...invoice,
                    invoiceNumber,
                    vendorName,
                    projectSite,
                    materialDifference,
                    invoiceDate,
                    challanDate,
                    challanCreated: "Yes", // Assuming challan is created for bulk entries, adjust as needed
                });
            }
        }

        let savedData = [];

        if (validInvoices.length > 0) {
            savedData = await TaxInvoice.insertMany(validInvoices, {
                ordered: false,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Bulk tax invoice upload completed",
            totalReceived: invoices.length,
            totalInserted: savedData.length,
            totalDuplicates: duplicateInvoices.length,
            insertedData: savedData,
            duplicateData: duplicateInvoices,
        });
    } catch (error) {
        console.log("Bulk Invoice Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
};


// Delete Tax Invoice 
exports.deleteTaxInnvoice = async (req, res) => {
    try {
        const { taxInvoiceId } = req.params;

        if (!taxInvoiceId) {
            return res.status(400).json({
                message: "Tax Invoice ID is required",
            });
        }

        // Find and delete by MongoDB _id
        const deletedInvoice = await TaxInvoice.findByIdAndDelete(
            taxInvoiceId
        );

        if (!deletedInvoice) {
            return res.status(404).json({
                message: "Tax Invoice not found",
            });
        }

        res.status(200).json({
            message: "Tax Invoice deleted successfully 🚀",
            data: deletedInvoice,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
            error: error.message,
        });
    }
}

//  Export tax Inoice Data
exports.intoExcel = async (req, res) => {
    try {
        const invoices = await TaxInvoice.find();

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Tax Invoice Register");

        // Header Row
        worksheet.columns = [
            { header: "Invoice Date", key: "invoiceDate", width: 18 },
            { header: "Invoice Number", key: "invoiceNumber", width: 25 },
            { header: "Invoice Amount", key: "invoiceAmount", width: 18 },
            { header: "Vendor Name", key: "vendorName", width: 35 },
            { header: "Project Site", key: "projectSite", width: 30 },
            { header: "Challan Created", key: "challanCreated", width: 18 },
            { header: "Challan Number", key: "challanNumber", width: 25 },
            { header: "Challan Date", key: "challanDate", width: 18 },
            { header: "Delivery Status", key: "deliveryStatus", width: 18 },
            { header: "Quantity Sent", key: "quantitySent", width: 18 },
            { header: "Quantity Received", key: "quantityReceived", width: 20 },
            { header: "Material Difference", key: "materialDifference", width: 20 }
        ];

        // Add Data Rows
        invoices.forEach((invoice) => {
            worksheet.addRow({
                invoiceDate: invoice.invoiceDate,
                invoiceNumber: invoice.invoiceNumber,
                invoiceAmount: invoice.invoiceAmount,
                vendorName: invoice.vendorName,
                projectSite: invoice.projectSite,
                challanCreated: invoice.challanCreated,
                challanNumber: invoice.challanNumber,
                challanDate: invoice.challanDate,
                deliveryStatus: invoice.deliveryStatus,
                quantitySent: invoice.quantitySent,
                quantityReceived: invoice.quantityReceived,
                materialDifference: invoice.materialDifference
            });
        });

        // Response Headers
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=TaxInvoiceRegister.xlsx"
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
}

// Filter Tax Invoice List

exports.filterInvoice = async (req, res) => {
    try {
        const filters = req.query;

        let query = {};

        if (filters.invoiceNumber) {
            query.invoiceNumber = filters.invoiceNumber;
        }

        if (filters.vendorName) {
            query.vendorName = filters.vendorName;
        }

        if (filters.projectSite) {
            query.projectSite = filters.projectSite;
        }

        if (filters.deliveryStatus) {
            query.deliveryStatus = filters.deliveryStatus;
        }

        if (filters.invoiceDate) {
            query.invoiceDate = filters.invoiceDate;
        }

        if (filters.challanNumber) {
            query.challanNumber = filters.challanNumber;
        }

        const data = await TaxInvoice.find(query);

        res.status(200).json({
            message: "Filtered data fetched successfully",
            data
        });

    } catch (error) {
        res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }
}

// Edit Particular Tax Invoice

exports.updateInvoice = async (req, res) => {
    try {
        const { taxInvoiceId } = req.params;

        if (!taxInvoiceId) {
            return res.status(400).json({
                message: "Tax Invoice ID is required",
            });
        }

        const formData = req.body;
        //  let itemDetails=req.body.itemDetails;
        //  itemDetails=[];

        // 📂 Files
        const invoiceFileObj = req.files.find(f => f.fieldname === "invoiceFile");
        const challanFileObj = req.files.find(f => f.fieldname === "challanFile");

        const invoiceFile = invoiceFileObj ? invoiceFileObj.path : null;
        const challanFile = challanFileObj ? challanFileObj.path : null;

        // 🧠 Auto Material Difference
        let materialDifference = "No Difference";

        if (
            formData.quantitySent &&
            formData.quantityReceived &&
            Number(formData.quantitySent) !== Number(formData.quantityReceived)
        ) {
            materialDifference = "Difference Found";
        }

        // 🔍 Find existing record first
        const existingInvoice = await TaxInvoice.findById(taxInvoiceId);

        if (!existingInvoice) {
            return res.status(404).json({
                message: "Tax Invoice not found",
            });
        }

        // 🔥 Update object (smart merge)
        const updateData = {
            ...formData,
            materialDifference,

            // ✅ Only update file if new uploaded
            invoiceFile: invoiceFile || existingInvoice.invoiceFile,
            challanFile: challanFile || existingInvoice.challanFile,
        };

        const updatedInvoice = await TaxInvoice.findByIdAndUpdate(
            taxInvoiceId,
            updateData,
            {
                returnDocument: "after",

            }
        );

        res.status(200).json({
            success: true,
            message: "Tax Invoice updated successfully 🚀",
            data: updatedInvoice,
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