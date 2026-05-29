const ProjectBoqItem = require("../model/projectBoqItem");
const MaterialDeliveryHistory = require("../model/materialDeliveryHistory");
const XLSX = require("xlsx");
const ItemIdentity = require("../model/ItemIdentity");

/**
 * Helper: update BOQ item calculated status
 */
const getDeliveryStatus = ({ boqQty, deliveredQty, installedQty }) => {
    const boq = Number(boqQty || 0);
    const delivered = Number(deliveredQty || 0);
    const installed = Number(installedQty || 0);

    if (installed >= boq && boq > 0) return "Installed";
    if (installed > 0 && installed < boq) return "Partially Installed";
    if (delivered >= boq && boq > 0) return "Fully Delivered";
    if (delivered > 0 && delivered < boq) return "Partially Delivered";

    return "Not Started";
};

/**
 * Add BOQ Item
 */
exports.createProjectBoqItem = async (req, res) => {
    try {
        const {
            projectRef,
            itemIdentityRef,
            boqQty,
            poQty,
            supplyRate,
            installationRate,
        } = req.body;

        if (!projectRef || !itemIdentityRef) {
            return res.status(400).json({
                success: false,
                message: "Project and Item Identity are required",
            });
        }

        const newItem = await ProjectBoqItem.create({
            ...req.body,
            boqQty: Number(boqQty || 0),
            poQty: Number(poQty || 0),
            supplyRate: Number(supplyRate || 0),
            installationRate: Number(installationRate || 0),
        });

        res.status(201).json({
            success: true,
            message: "BOQ item added successfully",
            data: newItem,
        });
    } catch (error) {
        console.log("Create BOQ Item Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get BOQ Items By Project
 */
exports.getProjectBoqItems = async (req, res) => {
    try {
        const { projectId } = req.params;

        const items = await ProjectBoqItem.find({ projectRef: projectId })
            .populate("projectRef", "name code clientName location")
            .populate("itemIdentityRef")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.log("Get Project BOQ Items Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Single BOQ Item
 */
exports.getSingleProjectBoqItem = async (req, res) => {
    try {
        const { boqItemId } = req.params;

        const item = await ProjectBoqItem.findById(boqItemId)
            .populate("projectRef", "name code clientName location")
            .populate("itemIdentityRef");

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.log("Get Single BOQ Item Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Update BOQ Item
 */
exports.updateProjectBoqItem = async (req, res) => {
    try {
        const { boqItemId } = req.params;

        const existingItem = await ProjectBoqItem.findById(boqItemId);

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const updateData = {
            ...req.body,
        };

        ["boqQty", "poQty", "supplyRate", "installationRate", "deliveredQty", "installedQty"].forEach(
            (field) => {
                if (updateData[field] !== undefined) {
                    updateData[field] = Number(updateData[field] || 0);
                }
            }
        );

        updateData.status = getDeliveryStatus({
            boqQty: updateData.boqQty ?? existingItem.boqQty,
            deliveredQty: updateData.deliveredQty ?? existingItem.deliveredQty,
            installedQty: updateData.installedQty ?? existingItem.installedQty,
        });

        const updatedItem = await ProjectBoqItem.findByIdAndUpdate(
            boqItemId,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("projectRef", "name code clientName location")
            .populate("itemIdentityRef");

        res.status(200).json({
            success: true,
            message: "BOQ item updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        console.log("Update BOQ Item Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Delete BOQ Item
 */
exports.deleteProjectBoqItem = async (req, res) => {
    try {
        const { boqItemId } = req.params;

        const existingItem = await ProjectBoqItem.findById(boqItemId);

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const deliveryCount = await MaterialDeliveryHistory.countDocuments({
            boqItemRef: boqItemId,
        });

        if (deliveryCount > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Cannot delete this BOQ item because delivery history already exists",
            });
        }

        await ProjectBoqItem.findByIdAndDelete(boqItemId);

        res.status(200).json({
            success: true,
            message: "BOQ item deleted successfully",
        });
    } catch (error) {
        console.log("Delete BOQ Item Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Add Material Delivery Against BOQ Item
 */
exports.addMaterialDelivery = async (req, res) => {
    try {
        const {
            projectRef,
            boqItemRef,
            itemIdentityRef,
            challanRef,
            deliveryDate,
            quantitySent,
            quantityReceived,
            vendorName,
            vehicleNumber,
            remarks,
        } = req.body;

        if (!projectRef || !boqItemRef || !itemIdentityRef || !deliveryDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Project, BOQ item, item identity and delivery date are required",
            });
        }

        const boqItem = await ProjectBoqItem.findById(boqItemRef);

        if (!boqItem) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const qtyReceived = Number(quantityReceived || 0);
        const qtySent = Number(quantitySent || 0);

        const newDeliveredQty = Number(boqItem.deliveredQty || 0) + qtyReceived;

        if (newDeliveredQty > Number(boqItem.boqQty || 0)) {
            return res.status(400).json({
                success: false,
                message: "Delivered quantity cannot be greater than BOQ quantity",
            });
        }

        const history = await MaterialDeliveryHistory.create({
            projectRef,
            boqItemRef,
            itemIdentityRef,
            challanRef: challanRef || null,
            deliveryDate,
            quantitySent: qtySent,
            quantityReceived: qtyReceived,
            vendorName: vendorName || "",
            vehicleNumber: vehicleNumber || "",
            remarks: remarks || "",
        });

        const status = getDeliveryStatus({
            boqQty: boqItem.boqQty,
            deliveredQty: newDeliveredQty,
            installedQty: boqItem.installedQty,
        });

        const updatedBoqItem = await ProjectBoqItem.findByIdAndUpdate(
            boqItemRef,
            {
                deliveredQty: newDeliveredQty,
                status,
                lastDeliveryDate: deliveryDate,
            },
            { new: true }
        )
            .populate("projectRef", "name code")
            .populate("itemIdentityRef");

        res.status(201).json({
            success: true,
            message: "Material delivery added successfully",
            data: {
                history,
                boqItem: updatedBoqItem,
            },
        });
    } catch (error) {
        console.log("Add Material Delivery Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Delivery History By BOQ Item
 */
exports.getDeliveryHistoryByBoqItem = async (req, res) => {
    try {
        const { boqItemId } = req.params;

        const history = await MaterialDeliveryHistory.find({
            boqItemRef: boqItemId,
        })
            .populate("projectRef", "name code")
            .populate("boqItemRef")
            .populate("itemIdentityRef")
            .sort({ deliveryDate: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        console.log("Get Delivery History Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Delivery History By Project
 */
exports.getDeliveryHistoryByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const history = await MaterialDeliveryHistory.find({
            projectRef: projectId,
        })
            .populate("projectRef", "name code")
            .populate("boqItemRef")
            .populate("itemIdentityRef")
            .sort({ deliveryDate: -1 });

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        console.log("Get Project Delivery History Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Mark Installed Quantity
 */
exports.markInstalledQuantity = async (req, res) => {
    try {
        const { boqItemId } = req.params;
        const { installedQty, installationDate, remarks } = req.body;

        const boqItem = await ProjectBoqItem.findById(boqItemId);

        if (!boqItem) {
            return res.status(404).json({
                success: false,
                message: "BOQ item not found",
            });
        }

        const newInstalledQty =
            Number(boqItem.installedQty || 0) + Number(installedQty || 0);

        if (newInstalledQty > Number(boqItem.deliveredQty || 0)) {
            return res.status(400).json({
                success: false,
                message: "Installed quantity cannot be greater than delivered quantity",
            });
        }

        const status = getDeliveryStatus({
            boqQty: boqItem.boqQty,
            deliveredQty: boqItem.deliveredQty,
            installedQty: newInstalledQty,
        });

        const updatedItem = await ProjectBoqItem.findByIdAndUpdate(
            boqItemId,
            {
                installedQty: newInstalledQty,
                status,
                lastInstallationDate: installationDate || new Date(),
                installationRemarks: remarks || "",
            },
            { new: true }
        )
            .populate("projectRef", "name code")
            .populate("itemIdentityRef");

        res.status(200).json({
            success: true,
            message: "Installed quantity updated successfully",
            data: updatedItem,
        });
    } catch (error) {
        console.log("Mark Installed Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Procurement Pressure Report
 */
exports.getProcurementPressureReport = async (req, res) => {
    try {
        const { projectId } = req.params;

        const items = await ProjectBoqItem.find({ projectRef: projectId })
            .populate("projectRef", "name code")
            .populate("itemIdentityRef")
            .sort({ priority: 1, expectedDeliveryDate: 1 });

        const report = items.map((item) => {
            const boqQty = Number(item.boqQty || 0);
            const poQty = Number(item.poQty || 0);
            const deliveredQty = Number(item.deliveredQty || 0);
            const installedQty = Number(item.installedQty || 0);

            return {
                _id: item._id,
                project: item.projectRef,
                item: item.itemIdentityRef,

                group: item.group,
                activity: item.activity,
                generalName: item.generalName,
                description: item.description,
                uom: item.uom,

                boqQty,
                poQty,
                deliveredQty,
                installedQty,

                balanceBoqQty: boqQty - deliveredQty,
                pendingProcurementQty: boqQty - poQty,
                balanceToInstall: deliveredQty - installedQty,

                expectedDeliveryDate: item.expectedDeliveryDate,
                priority: item.priority,
                status: item.status,

                procurementAlert:
                    boqQty - poQty > 0 ? "Purchase Required" : "PO Covered",

                deliveryAlert:
                    boqQty - deliveredQty > 0 ? "Delivery Pending" : "Delivery Completed",

                installationAlert:
                    deliveredQty - installedQty > 0
                        ? "Installation Pending"
                        : "Installation Completed",
            };
        });

        res.status(200).json({
            success: true,
            count: report.length,
            data: report,
        });
    } catch (error) {
        console.log("Procurement Pressure Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// Bulk  Boq Item 
exports.bulkUploadProjectBoq = async (req, res) => {
    try {
        const { projectRef } = req.body;

        if (!projectRef) {
            return res.status(400).json({
                success: false,
                message: "Project reference is required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Excel file is required",
            });
        }

        // for local upload
        const workbook = XLSX.read(req.file.buffer, {
            type: "buffer",
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
        });

        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message: "Excel file is empty",
            });
        }

        const createdItems = [];
        const skippedRows = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const itemCode =
                row["Item Code"] ||
                row["ITEM CODE"] ||
                row["itemCode"] ||
                row["ItemCode"];

            const generalName =
                row["General Name"] ||
                row["GENERAL NAME"] ||
                row["generalName"] ||
                row["Item Name"] ||
                row["ITEM NAME"];

            const boqQty =
                row["BOQ Qty"] ||
                row["BOQ QTY"] ||
                row["boqQty"] ||
                row["Qty"] ||
                row["QTY"];

            if (!itemCode || !boqQty) {
                skippedRows.push({
                    row: i + 2,
                    reason: "Item Code or BOQ Qty missing",
                    data: row,
                });
                continue;
            }
            // Have idea you should be add a our  item identity item code 

            //   const itemIdentity = await ItemIdentity.findOne({
            //     itemCode: String(itemCode).trim(),
            //   });

            //   if (!itemIdentity) {
            //     skippedRows.push({
            //       row: i + 2,
            //       reason: `Item identity not found for itemCode: ${itemCode}`,
            //       data: row,
            //     });
            //     continue;
            //   }

            //   const existingBoqItem = await ProjectBoqItem.findOne({
            //     projectRef,
            //     itemIdentityRef: itemIdentity._id,
            //   });

            //   if (existingBoqItem) {
            //     skippedRows.push({
            //       row: i + 2,
            //       reason: "BOQ item already exists for this project",
            //       data: row,
            //     });
            //     continue;
            //   }

            const existingBoqItem = await ProjectBoqItem.findOne({
                projectRef,
                itemCode,
            });

            if (existingBoqItem) {
                skippedRows.push({
                    row: i + 2,
                    reason: "BOQ item already exists",
                    data: row,
                });
                continue;
            }

            const newBoqItem = await ProjectBoqItem.create({
                projectRef,
                itemIdentityRef: null, // Set to null for now, as we are not linking with ItemIdentity in this bulk upload
                boqItemCode:itemCode,
                group: row["Group"] || row["GROUP"] || "",
                activity: row["Activity"] || row["ACTIVITY"] || "",
                boqSrNo: row["BOQ Sr No"] || row["BOQ SR NO"] || "",
                slNo: row["SL No"] || row["SL NO"] || row["Sl.No."] || "",
                generalName,
                description:
                    row["Description"] ||
                    row["DESCRIPTION"] ||
                    row["Item Description"] ||
                    "",
                uom: row["UOM"] || row["Unit"] || row["UNIT"] || "",

                boqQty: Number(boqQty || 0),
                poQty: Number(row["PO Qty"] || row["PO QTY"] || row["poQty"] || 0),

                supplyRate: Number(
                    row["Supply Rate"] || row["SUPPLY RATE"] || row["supplyRate"] || 0
                ),

                installationRate: Number(
                    row["Installation Rate"] ||
                    row["INSTALLATION RATE"] ||
                    row["installationRate"] ||
                    0
                ),

                expectedDeliveryDate:
                    row["Expected Delivery Date"] ||
                    row["EXPECTED DELIVERY DATE"] ||
                    "",

                priority: row["Priority"] || "Medium",

                remarks: row["Remarks"] || "",
            });

            createdItems.push(newBoqItem);
        }

        res.status(201).json({
            success: true,
            message: "BOQ Excel processed successfully",
            createdCount: createdItems.length,
            skippedCount: skippedRows.length,
            data: createdItems,
            skippedRows,
        });
    } catch (error) {
        console.log("Bulk Upload Project BOQ Error:", error);

        res.status(500).json({
            success: false,
            message: "BOQ upload failed",
            error: error.message,
        });
    }
};