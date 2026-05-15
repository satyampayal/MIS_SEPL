const BOQMaster = require("../model/boqMaster");
const BOQItem = require("../model/boqItem");
const XLSX = require("xlsx");
// CREATE BOQ MASTER ONLY
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
            boqName,
            boqType: boqType || "CLIENT",
            revisionNo: revisionNo || 0,
            remarks: remarks || "",
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
            .populate("projectRef", "projectName siteName clientName")
            //   .populate("contractorRef", "contractorName name mobile")
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

        const boq = await BOQMaster.findById(boqId)
            .populate("projectRef", "name siteName clientName")
        //   .populate("contractorRef", "contractorName name mobile");

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
            itemCode,
            boqSrNo,
            description,
            generalName,
            uom,
            boqQty,
            qtyText,
            supplyRate,
            installationRate,
            remarks,
            category,
            subCategory,
        } = req.body;

        if (!description) {
            return res.status(400).json({
                success: false,
                message: "Description is required",
            });
        }

        const finalQty = Number(boqQty) || 0;
        const finalSupplyRate = Number(supplyRate) || 0;
        const finalInstallationRate = Number(installationRate) || 0;

        const item = await BOQItem.create({
            boqRef: boq._id,
            projectRef: boq.projectRef,
            contractorRef: boq.contractorRef || null,

            itemCode: itemCode || "",
            boqSrNo: boqSrNo || "",
            description,
            generalName: generalName || "",
            uom: uom || "",
            boqQty: finalQty,
            qtyText: qtyText || "",

            supplyRate: finalSupplyRate,
            installationRate: finalInstallationRate,

            totalSupplyAmount: finalQty * finalSupplyRate,
            totalInstallationAmount: finalQty * finalInstallationRate,

            balanceQty: finalQty,

            category: category || "",
            subCategory: subCategory || "",

            remarks: remarks || "",
        });

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
            itemCode,
            boqSrNo,
            description,
            generalName,
            uom,
            boqQty,
            qtyText,
            supplyRate,
            installationRate,
            remarks,
            category,
            subCategory,
        } = req.body;

        const finalQty =
            boqQty !== undefined ? Number(boqQty) || 0 : item.boqQty;

        const finalSupplyRate =
            supplyRate !== undefined ? Number(supplyRate) || 0 : item.supplyRate;

        const finalInstallationRate =
            installationRate !== undefined
                ? Number(installationRate) || 0
                : item.installationRate;

        item.itemCode = itemCode ?? item.itemCode;
        item.boqSrNo = boqSrNo ?? item.boqSrNo;
        item.description = description ?? item.description;
        item.generalName = generalName ?? item.generalName;
        item.uom = uom ?? item.uom;
        item.boqQty = finalQty;
        item.qtyText = qtyText ?? item.qtyText;

        item.supplyRate = finalSupplyRate;
        item.installationRate = finalInstallationRate;

        item.totalSupplyAmount = finalQty * finalSupplyRate;
        item.totalInstallationAmount = finalQty * finalInstallationRate;

        item.balanceQty = finalQty - (item.completedQty || 0);

        item.category = category ?? item.category;
        item.subCategory = subCategory ?? item.subCategory;
        item.remarks = remarks ?? item.remarks;

        await item.save();

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

        await BOQItem.findByIdAndDelete(itemId);

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

// Upload From Excel 
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

        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer",
        });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        console.log("Excel Sheet Name:", sheetName);

        const rows = XLSX.utils.sheet_to_json(sheet, {
            defval: "",
        });

        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message: "Excel file is empty",
            });
        }

        const toNumber = (value) => {
            if (value === undefined || value === null || value === "") return 0;

            const cleaned = String(value)
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim();

            const num = Number(cleaned);
            return isNaN(num) ? 0 : num;
        };

        const items = rows.map((row, index) => {
            const rawQty = row["PO Qty"] || row["Qty"] || row["Quantity"] || 0;

            const poQty = toNumber(rawQty);
            const installationRate = toNumber(row["Installation Rate"]);
            const contractorInstallationRate = toNumber(
                row["Contractor Installation Rate"]
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

            const qtyText = isNaN(Number(String(rawQty).replace(/,/g, "")))
                ? String(rawQty || "")
                : "";

            return {
                boqRef: boq._id,
                projectRef: boq.projectRef,
                contractorRef: boq.contractorRef || null,

                boqItemCode:
                    row["Boq Item Code"] ||
                    row["BOQ Item Code"] ||
                    row["Item Code"] ||
                    row["ItemCode"] ||
                    row["Code"] ||
                    "",

                activity: row["Activity"] || "",

                boqSrNo:
                    row["BOQ Sr. No"] ||
                    row["BOQ Sr No"] ||
                    row["BOQ Sr.No"] ||
                    row["Sr No"] ||
                    "",

                generalName:
                    row["Genral Name"] ||
                    row["General Name"] ||
                    row["Short Name"] ||
                    "",

                description: row["Description"] || row["Item Description"] || "",

                uom: row["UOM"] || row["Unit"] || "",

                poQty,
                qtyText,

                installationRate,
                installationAmount,

                contractorInstallationRate,
                contractorInstallationAmount,

                completedQty: 0,
                billedQty: 0,
                balanceQty: poQty,

                sourceRowNumber: index + 2,
                remarks: row["Remarks"] || row["Remark"] || "",
            };
        });

        await BOQItem.insertMany(items);

        boq.originalFileUrl = req.file.path;
        await boq.save();

        return res.status(201).json({
            success: true,
            message: "BOQ Excel imported successfully",
            totalRows: rows.length,
            importedItems: items.length,
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


//boq item by boq
exports.getBOQItemsByBOQ = async (req, res) => {
  try {
    const { boqId } = req.params;

    console.log(await BOQItem.find({ boqRef: boqId }));
    const items = await BOQItem.find({
      boqRef: boqId,
    }).sort({ boqItemCode: 1 });

    return res.status(200).json({
      success: true,
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

// Get Boq By projectId
exports.getBOQByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
const boqs = await BOQMaster.find({
  projectRef: projectId
});

    return res.status(200).json({
      success: true,
      boqs,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch BOQs",
    });
  }
};