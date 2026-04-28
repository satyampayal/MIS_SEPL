
const Challan = require("../model/Challan");

exports.createChallan = async (req, res) => {
    try {
        const lastChallan = await Challan.findOne().sort({ createdAt: -1 });

        let newChallanNumber = "CH-2026-001";

        if (lastChallan) {
            const lastNumber = parseInt(
                lastChallan.challanNumber.split("-")[2]
            );

            newChallanNumber = `CH-2026-${String(lastNumber + 1).padStart(3, "0")}`;
        }

        const challan = await Challan.create({
            ...req.body,
            challanNumber: newChallanNumber,
            challanFile: req.file ? req.file.path : ""
        });

        res.status(201).json({
            success: true,
            data: challan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getChallanByNumber = async (req, res) => {
    try {
        const challan = await Challan.findOne({
            challanNumber: req.params.challanNumber
        });

        if (!challan) {
            return res.status(404).json({
                success: false,
                message: "Challan not found"
            });
        }

        res.status(200).json({
            success: true,
            data: challan
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//  Get Alll Challans
exports.getAllChallans = async (req, res) => {
    try {
        const challans = await Challan.find()
            .sort({ createdAt: -1 });
            

        res.status(200).json({
            success: true,
            count: challans.length,
            data: challans
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};