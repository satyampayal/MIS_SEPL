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
