const BOQMaster = require("../model/boqMaster");
const BOQItem = require("../model/boqItem");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const toNumber = (value) => {
     if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "NA" ||
    value === "N/A" ||
    value === "-"
  ) {
    return 0;
  }

    const cleaned = String(value)
        .replace(/,/g, "")
        .replace(/₹/g, "")
        .trim();

    const num = Number(cleaned);
    return Number.isNaN(num) ? 0 : num;
};

const cleanText = (value) => String(value || "").trim();

const buildKeywords = (row) => {
    return [
        row.activity,
        row.generalName,
        row.description,
        row.boqItemCode,
        row.boqSrNo,
        row.category,
        row.subCategory,
    ]
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, " ")
        .split(" ")
        .filter((w) => w.length > 2);
};

// CREATE BOQ MASTER
exports.createBOQ = async (req, res) => {
    try {
        const {
            projectRef,
            contractorRef,
            boqName,
            boqType,
            revisionNo,
            remarks,
        } = req.body;

        if (!projectRef || !boqName) {
            return res.status(400).json({
                success: false,
                message: "Project and BOQ name are required",
            });
        }

        const boq = await BOQMaster.create({
            projectRef,
            contractorRef: contractorRef || null,
            boqName: cleanText(boqName),
            boqType: boqType || "CLIENT",
            revisionNo: Number(revisionNo || 0),
            remarks: remarks || "",
            uploadedBy: req.user?._id || null,
        });

        return res.status(201).json({
            success: true,
            message: "BOQ created successfully",
            boq,
        });
    } catch (error) {
        console.error("Create BOQ Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create BOQ",
            error: error.message,
        });
    }
};

// GET ALL BOQ BY PROJECT
exports.getAllBOQByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const boqs = await BOQMaster.find({ projectRef: projectId })
            .populate("projectRef", "projectName name siteName clientName complitionDate")
            .populate("contractorRef", "contractorName mobile")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: boqs.length,
            boqs,
        });
    } catch (error) {
        console.error("Get BOQ Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQ list",
            error: error.message,
        });
    }
};

// GET ALL BOQ 
exports.getAllBOQ = async (req, res) => {
    try {
        // const { projectId } = req.params;

        const boqs = await BOQMaster.find({})
            .populate("projectRef", "projectName name siteName clientName complitionDate")
            .populate("contractorRef", "contractorName mobile")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: boqs.length,
            boqs,
        });
    } catch (error) {
        console.error("Get BOQ Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQ list",
            error: error.message,
        });
    }
};

// GET SINGLE BOQ WITH ITEMS
exports.getSingleBOQ = async (req, res) => {
    try {
        const { boqId } = req.params;
        if (!boqId || boqId === "undefined" || !mongoose.Types.ObjectId.isValid(boqId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid BOQ ID",
            });
        }

        const boq = await BOQMaster.findById(boqId)
            .populate("projectRef", "projectName name siteName clientName complitionDate")
            .populate("contractorRef", "contractorName mobile");

        if (!boq) {
            return res.status(404).json({
                success: false,
                message: "BOQ not found",
            });
        }

        const items = await BOQItem.find({ boqRef: boqId }).sort({
            sourceRowNumber: 1,
            createdAt: 1,
        });

        return res.status(200).json({
            success: true,
            boq,
            items,
        });
    } catch (error) {
        console.error("Get Single BOQ Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQ details",
            error: error.message,
        });
    }
};

// DELETE BOQ + ITS ITEMS
exports.deleteBOQ = async (req, res) => {
    try {
        const { boqId } = req.params;

        const boq = await BOQMaster.findById(boqId);

        if (!boq) {
            return res.status(404).json({
                success: false,
                message: "BOQ not found",
            });
        }

        await BOQItem.deleteMany({ boqRef: boqId });
        await BOQMaster.findByIdAndDelete(boqId);

        return res.status(200).json({
            success: true,
            message: "BOQ and related items deleted successfully",
        });
    } catch (error) {
        console.error("Delete BOQ Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete BOQ",
            error: error.message,
        });
    }
};

// ADD SINGLE BOQ ITEM
exports.addBOQItem = async (req, res) => {
    try {
        const { boqId } = req.params;

        const boq = await BOQMaster.findById(boqId);

        if (!boq) {
            return res.status(404).json({
                success: false,
                message: "BOQ not found",
            });
        }

        const {
            boqItemCode,
            itemCode,
            activity,
            boqSrNo,

            supplyItemCode,
            installationItemCode,

            description,
            generalName,
            uom,
            poQty,
            boqQty,
            qtyText,
            supplyRate,
            installationRate,
            contractorInstallationRate,
            remarks,
            category,
            subCategory,
            aliases,
        } = req.body;

        if (!description && !activity && !generalName) {
            return res.status(400).json({
                success: false,
                message: "Activity / General Name / Description is required",
            });
        }

        const finalQty = toNumber(poQty ?? boqQty);
        const finalSupplyRate = toNumber(supplyRate);
        const finalInstallationRate = toNumber(installationRate);
        const finalContractorRate = toNumber(contractorInstallationRate);

        const payload = {
            boqRef: boq._id,
            projectRef: boq.projectRef,
            contractorRef: boq.contractorRef || null,

            boqItemCode: boqItemCode || itemCode || "",
            activity: activity || "",
            boqSrNo: boqSrNo || "",

            supplyItemCode: supplyItemCode || "",
            installationItemCode: installationItemCode || "",

            generalName: generalName || "",
            description: description || "",
            uom: uom || "",

            poQty: finalQty,
            qtyText: qtyText || "",

            supplyRate: finalSupplyRate,
            supplyAmount: finalQty * finalSupplyRate,

            installationRate: finalInstallationRate,
            installationAmount: finalQty * finalInstallationRate,

            contractorInstallationRate: finalContractorRate,
            contractorInstallationAmount: finalQty * finalContractorRate,

            completedQty: 0,
            approvedQty: 0,
            billedQty: 0,
            balanceQty: finalQty,

            category: category || "",
            subCategory: subCategory || "",
            aliases: Array.isArray(aliases) ? aliases : [],
            remarks: remarks || "",
        };

        payload.keywords = buildKeywords(payload);

        const item = await BOQItem.create(payload);

        await refreshBOQMasterTotals(boq._id);

        return res.status(201).json({
            success: true,
            message: "BOQ item added successfully",
            item,
        });
    } catch (error) {
        console.error("Add BOQ Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add BOQ item",
            error: error.message,
        });
    }
};

// UPDATE SINGLE BOQ ITEM
exports.updateBOQItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await BOQItem.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const {
            boqItemCode,
            itemCode,
            activity,
            boqSrNo,

            supplyItemCode,
            installationItemCode,

            description,
            generalName,
            uom,
            poQty,
            boqQty,
            qtyText,
            supplyRate,
            installationRate,
            contractorInstallationRate,
            remarks,
            category,
            subCategory,
            aliases,
            status,
        } = req.body;

        if (boqItemCode !== undefined || itemCode !== undefined) {
            item.boqItemCode = boqItemCode ?? itemCode ?? item.boqItemCode;
        }

        item.activity = activity ?? item.activity;
        item.boqSrNo = boqSrNo ?? item.boqSrNo;

        item.supplyItemCode = supplyItemCode ?? item.supplyItemCode;
        item.installationItemCode = installationItemCode ?? item.installationItemCode;

        item.description = description ?? item.description;
        item.generalName = generalName ?? item.generalName;
        item.uom = uom ?? item.uom;

        if (poQty !== undefined || boqQty !== undefined) {
            item.poQty = toNumber(poQty ?? boqQty);
        }

        item.qtyText = qtyText ?? item.qtyText;

        if (supplyRate !== undefined) {
            item.supplyRate = toNumber(supplyRate);
        }

        if (installationRate !== undefined) {
            item.installationRate = toNumber(installationRate);
        }
        if (contractorInstallationRate !== undefined) {
            item.contractorInstallationRate = toNumber(contractorInstallationRate);
        }

        item.supplyAmount = Number(item.poQty || 0) * Number(item.supplyRate || 0);
        item.installationAmount = Number(item.poQty || 0) * Number(item.installationRate || 0);
        item.contractorInstallationAmount =
            Number(item.poQty || 0) * Number(item.contractorInstallationRate || 0);

        item.balanceQty = Math.max(
            Number(item.poQty || 0) - Number(item.completedQty || 0),
            0
        );

        item.category = category ?? item.category;
        item.subCategory = subCategory ?? item.subCategory;
        item.remarks = remarks ?? item.remarks;
        item.status = status ?? item.status;

        if (Array.isArray(aliases)) {
            item.aliases = aliases;
        }

        item.keywords = buildKeywords(item);

        await item.save();

        await refreshBOQMasterTotals(item.boqRef);

        return res.status(200).json({
            success: true,
            message: "BOQ item updated successfully",
            item,
        });
    } catch (error) {
        console.error("Update BOQ Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update BOQ item",
            error: error.message,
        });
    }
};

// DELETE BOQ ITEM
exports.deleteBOQItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await BOQItem.findById(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const boqRef = item.boqRef;

        await BOQItem.findByIdAndDelete(itemId);
        await refreshBOQMasterTotals(boqRef);

        return res.status(200).json({
            success: true,
            message: "BOQ item deleted successfully",
        });
    } catch (error) {
        console.error("Delete BOQ Item Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete BOQ item",
            error: error.message,
        });
    }
};

// UPLOAD BOQ ITEMS FROM EXCEL
exports.uploadBOQExcelItems = async (req, res) => {
    try {
        const { boqId } = req.params;

        const boq = await BOQMaster.findById(boqId);

        if (!boq) {
            return res.status(404).json({
                success: false,
                message: "BOQ not found",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "BOQ Excel file is required",
            });
        }

        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message: "Excel file is empty",
            });
        }

        const skippedRows = [];

        const items = rows
            .map((row, index) => {
                const rawQty =
                    row["PO Qty"] ||
                    row["Qty"] ||
                    row["Quantity"] ||
                    row["BOQ Qty"] ||
                    0;

                const poQty = toNumber(rawQty);

                const supplyRate = toNumber(
                    row["Supply Rate"] ||
                    row["Material Rate"] ||
                    row["Company Supply Rate"] ||
                    row["Item Rate"]
                );

                let supplyAmount = toNumber(
                    row["Supply Amount"] ||
                    row["Material Amount"] ||
                    row["Company Supply Amount"]
                );

                if (!supplyAmount && poQty && supplyRate) {
                    supplyAmount = poQty * supplyRate;
                }

                const installationRate = toNumber(row["Installation Rate"]);

                const contractorInstallationRate = toNumber(
                    row["Contractor Installation Rate"] ||
                    row["Contractor Rate"] ||
                    row["Contractor Inst Rate"]
                );

                let installationAmount = toNumber(row["Installation Amount"]);

                let contractorInstallationAmount = toNumber(
                    row["Contractor Inst. Amount"] ||
                    row["Contractor Inst Amount"] ||
                    row["Contractor Installation Amount"]
                );

                if (!installationAmount && poQty && installationRate) {
                    installationAmount = poQty * installationRate;
                }

                if (!contractorInstallationAmount && poQty && contractorInstallationRate) {
                    contractorInstallationAmount = poQty * contractorInstallationRate;
                }

                const payload = {
                    boqRef: boq._id,
                    projectRef: boq.projectRef,
                    contractorRef: boq.contractorRef || null,

                    boqItemCode: cleanText(
                        row["Boq Item Code"] ||
                        row["BOQ Item Code"] ||
                        row["Item Code"] ||
                        row["ItemCode"] ||
                        row["Code"]
                    ),

                    activity: cleanText(row["Activity"]),

                    boqSrNo: cleanText(
                        row["BOQ Sr. No"] ||
                        row["BOQ Sr No"] ||
                        row["BOQ Sr.No"] ||
                        row["Sr No"]
                    ),
                    supplyItemCode: cleanText(
                        row["Supply Item Code"]
                    ),
                    installationItemCode: cleanText(
                        row["Installation Item Code"]
                    ),

                    generalName: cleanText(
                        row["Genral Name"] ||
                        row["General Name"] ||
                        row["Short Name"]
                    ),

                    description: cleanText(
                        row["Description"] ||
                        row["Material Description"] ||
                        row["Item Description"]
                    ),

                    uom: cleanText(row["UOM"] || row["Unit"]),

                    poQty,
                    qtyText: Number.isNaN(Number(String(rawQty).replace(/,/g, "")))
                        ? String(rawQty || "")
                        : "",

                    supplyRate,
                    supplyAmount,

                    installationRate,
                    installationAmount,

                    contractorInstallationRate,
                    contractorInstallationAmount,

                    completedQty: 0,
                    approvedQty: 0,
                    billedQty: 0,
                    balanceQty: poQty,

                    category: cleanText(row["Category"]),
                    subCategory: cleanText(row["Sub Category"] || row["SubCategory"]),

                    aliases: [],
                    sourceRowNumber: index + 2,
                    remarks: cleanText(row["Remarks"] || row["Remark"]),
                };

                payload.keywords = buildKeywords(payload);

                if (!payload.activity && !payload.generalName && !payload.description) {
                    skippedRows.push({
                        rowNumber: index + 2,
                        reason: "Activity / General Name / Description missing",
                    });
                    return null;
                }

                return payload;
            })
            .filter(Boolean);

        if (!items.length) {
            return res.status(400).json({
                success: false,
                message: "No valid BOQ items found in Excel",
                skippedRows,
            });
        }

        await BOQItem.insertMany(items);

        boq.originalFileUrl = req.file.path || "";
        boq.totalItems = await BOQItem.countDocuments({ boqRef: boq._id });
        boq.totalBoqAmount = items.reduce(
            (sum, item) => sum + Number(item.installationAmount || 0),
            0
        );
        boq.totalContractorAmount = items.reduce(
            (sum, item) => sum + Number(item.contractorInstallationAmount || 0),
            0
        );

        await refreshBOQMasterTotals(boq._id);

        return res.status(201).json({
            success: true,
            message: "BOQ Excel imported successfully",
            totalRows: rows.length,
            importedItems: items.length,
            skippedCount: skippedRows.length,
            skippedRows,
            boq,
        });
    } catch (error) {
        console.error("Upload BOQ Excel Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload BOQ Excel",
            error: error.message,
        });
    }
};

// GET BOQ ITEMS BY BOQ
exports.getBOQItemsByBOQ = async (req, res) => {
    try {
        const { boqId } = req.params;

        const items = await BOQItem.find({ boqRef: boqId }).sort({
            sourceRowNumber: 1,
            boqItemCode: 1,
        });

        return res.status(200).json({
            success: true,
            count: items.length,
            items,
        });
    } catch (error) {
        console.log("Get BOQ Items Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQ items",
            error: error.message,
        });
    }
};

// GET BOQ BY PROJECT
exports.getBOQByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { boqType, status } = req.query;

        const query = { projectRef: projectId };

        if (boqType) query.boqType = boqType;
        if (status) query.status = status;

        const boqs = await BOQMaster.find(query)
            .populate("contractorRef", "contractorName mobile")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: boqs.length,
            boqs,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch BOQs",
            error: error.message,
        });
    }
};

// PRIVATE HELPER
async function refreshBOQMasterTotals(boqId) {
    const stats = await BOQItem.aggregate([
        {
            $match: {
                boqRef: BOQMaster.db.base.Types.ObjectId.isValid(String(boqId))
                    ? new BOQMaster.db.base.Types.ObjectId(String(boqId))
                    : boqId,
            },
        },
        {
            $group: {
                _id: "$boqRef",
                totalItems: { $sum: 1 },
                totalBoqAmount: { $sum: "$installationAmount" },
                totalContractorAmount: { $sum: "$contractorInstallationAmount" },
            },
        },
    ]);

    const summary = stats[0] || {
        totalItems: 0,
        totalBoqAmount: 0,
        totalContractorAmount: 0,
    };

    await BOQMaster.findByIdAndUpdate(boqId, {
        totalItems: summary.totalItems,
        totalBoqAmount: summary.totalBoqAmount,
        totalContractorAmount: summary.totalContractorAmount,
    });
}

//  Suggest Boq Item respectd Boq for DPR Entery 
exports.suggestBOQItems = async (req, res) => {
    try {
        const { projectRef, query } = req.query;

        if (!projectRef || !query) {
            return res.status(400).json({
                success: false,
                message: "projectRef and query are required",
            });
        }

        const search = String(query).toLowerCase().trim();

        const items = await BOQItem.find({
            projectRef,
            status: "ACTIVE",
            $or: [
                { activity: { $regex: search, $options: "i" } },
                { generalName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { boqItemCode: { $regex: search, $options: "i" } },
                { boqSrNo: { $regex: search, $options: "i" } },
                { aliases: { $regex: search, $options: "i" } },
                { keywords: { $regex: search, $options: "i" } },
                { normalizedText: { $regex: search, $options: "i" } },
            ],
        }).limit(20);

        const scored = items
            .map((item) => {
                const text = [
                    item.activity,
                    item.generalName,
                    item.description,
                    item.boqItemCode,
                    item.boqSrNo,
                    ...(item.aliases || []),
                    ...(item.keywords || []),
                ]
                    .join(" ")
                    .toLowerCase();

                let score = 0;

                if (item.activity?.toLowerCase().includes(search)) score += 35;
                if (item.generalName?.toLowerCase().includes(search)) score += 30;
                if (item.description?.toLowerCase().includes(search)) score += 20;
                if (item.aliases?.some((a) => a.toLowerCase().includes(search))) score += 40;
                if (text.includes(search)) score += 10;

                const queryWords = search.split(/\s+/).filter(Boolean);
                const matchedWords = queryWords.filter((word) => text.includes(word));

                score += matchedWords.length * 10;

                return {
                    boqItemRef: item._id,
                    boqRef: item.boqRef,
                    contractorRef: item.contractorRef,

                    boqItemCode: item.boqItemCode,
                    boqSrNo: item.boqSrNo,
                    activity: item.activity,
                    generalName: item.generalName,
                    description: item.description,
                    uom: item.uom,

                    poQty: item.poQty,
                    completedQty: item.completedQty,
                    approvedQty: item.approvedQty,
                    billedQty: item.billedQty,
                    balanceQty: item.balanceQty,

                    installationRate: item.installationRate,
                    contractorInstallationRate: item.contractorInstallationRate,

                    matchScore: Math.min(score, 100),
                };
            })
            .sort((a, b) => b.matchScore - a.matchScore);

        return res.status(200).json({
            success: true,
            query,
            count: scored.length,
            suggestions: scored,
        });
    } catch (error) {
        console.error("Suggest BOQ Items Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to suggest BOQ items",
            error: error.message,
        });
    }
};