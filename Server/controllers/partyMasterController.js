const PartyMaster = require("../model/partyMaster");

// CREATE PARTY / VENDOR
exports.createParty = async (req, res) => {
    try {
        const {
            partyName,
            partyType,
            gstNumber,
            contactPerson,
            contactNumber,
            email,
            address,
            city,
            state,
        } = req.body;

        if (!partyName) {
            return res.status(400).json({
                success: false,
                message: "Party/Vendor name is required",
            });
        }

        const exists = await PartyMaster.findOne({
            partyName: partyName.trim(),
            gstNumber: gstNumber || "",
        });

        if (exists) {
            return res.status(409).json({
                success: false,
                message: "This party/vendor already exists",
                data: exists,
            });
        }

        const party = await PartyMaster.create({
            partyName,
            partyType,
            gstNumber,
            contactPerson,
            contactNumber,
            email,
            address,
            city,
            state,
        });

        res.status(201).json({
            success: true,
            message: "Party/Vendor created successfully",
            data: party,
        });
    } catch (error) {
        console.error("Create Party Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create party/vendor",
            error: error.message,
        });
    }
};

// GET ALL PARTIES WITH PAGINATION
exports.getAllParties = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const parties = await PartyMaster.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await PartyMaster.countDocuments();

        res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: parties,
        });
    } catch (error) {
        console.error("Get Parties Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get parties/vendors",
            error: error.message,
        });
    }
};

// GET SINGLE PARTY
exports.getPartyById = async (req, res) => {
    try {
        const party = await PartyMaster.findById(req.params.id);

        if (!party) {
            return res.status(404).json({
                success: false,
                message: "Party/Vendor not found",
            });
        }

        res.status(200).json({
            success: true,
            data: party,
        });
    } catch (error) {
        console.error("Get Party Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get party/vendor",
            error: error.message,
        });
    }
};

// UPDATE PARTY
exports.updateParty = async (req, res) => {
    try {
        const party = await PartyMaster.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!party) {
            return res.status(404).json({
                success: false,
                message: "Party/Vendor not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Party/Vendor updated successfully",
            data: party,
        });
    } catch (error) {
        console.error("Update Party Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update party/vendor",
            error: error.message,
        });
    }
};

// DELETE PARTY - SOFT DELETE
exports.deleteParty = async (req, res) => {
    try {
        const party = await PartyMaster.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!party) {
            return res.status(404).json({
                success: false,
                message: "Party/Vendor not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Party/Vendor disabled successfully",
            data: party,
        });
    } catch (error) {
        console.error("Delete Party Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete party/vendor",
            error: error.message,
        });
    }
};

// SEARCH PARTY / VENDOR FOR DROPDOWN
exports.searchParties = async (req, res) => {
    try {
        const search = req.query.search || "";
        const type = req.query.type || "";
        const limit = Number(req.query.limit) || 10;

        const query = {
            isActive: true,
        };

        if (search) {
            query.$or = [
                { partyName: { $regex: search, $options: "i" } },
                { gstNumber: { $regex: search, $options: "i" } },
                { contactNumber: { $regex: search, $options: "i" } },
            ];
        }

        if (type) {
            query.partyType = type;
        }

        const parties = await PartyMaster.find(query)
            .select("partyName partyType gstNumber contactPerson contactNumber city state")
            .sort({ partyName: 1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: parties.length,
            data: parties,
        });
    } catch (error) {
        console.error("Search Party Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to search party/vendor",
            error: error.message,
        });
    }
};