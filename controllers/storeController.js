const Store =require('../model/Store')
const XLSX = require('xlsx');
/*
Reusable function for auto code generation
*/
const generateStoreItemCode = async (category, mepHead) => {
    const categoryPrefix = category
        ? category.trim().charAt(0).toUpperCase()
        : "X";

    let mepPrefix = "XX";

    if (mepHead) {
        const mep = mepHead.trim().toLowerCase();

        if (mep === "electrical") {
            mepPrefix = "EL";
        } else {
            mepPrefix = mepHead.substring(0, 2).toUpperCase();
        }
    }

    const existingCount = await Store.countDocuments();

    const runningNumber = existingCount + 1;
    console.log(`${categoryPrefix}${runningNumber}${mepPrefix}`)

    return `${categoryPrefix}${runningNumber}${mepPrefix}`;
};


// Single Item Created 
exports.createStoreItem = async (req, res) => {
    try {
        const {
            itemName,
            category,
            unit,
            openingStock,
            minimumStock,
            rate,
            location,
            remarks,
            hsnCode,
            commodity,
            mepHead
        } = req.body;

             // Final Auto Generated Code
        const storeItemCode =await  generateStoreItemCode(category,mepHead);

        const storeItem = await Store.create({
            itemName,
            category,
            unit,
            openingStock,
            currentStock: openingStock,
            minimumStock,
            rate,
            location,
            remarks,
            hsnCode,
            commodity,
            mepHead,
            storeItemCode
        });

        res.status(201).json({
            success: true,
            message: "Store item created successfully",
            data: storeItem
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Bulk Item  Created

exports.createBulkStoreItem = async (req, res) => {
    try {
        const items = req.body.items;
        // console.log(items)
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items Array Is required",
                success: false
            })
        }

        const preparedItems = [];
       // Total existing items count from DB
    let totalItemsCount = await Store.countDocuments();

    for (const item of items) {
      const categoryPrefix = item.category
        ? item.category.trim().charAt(0).toUpperCase()
        : "X";

      let mepPrefix = "XX";

      if (item.mepHead) {
        const mep = item.mepHead.trim().toLowerCase();

        if (mep === "electrical") {
          mepPrefix = "EL";
        } else {
          mepPrefix = item.mepHead
            .substring(0, 2)
            .toUpperCase();
        }
      }

      // Increase count one by one
      totalItemsCount++;

      const storeItemCode = `${categoryPrefix}${totalItemsCount}${mepPrefix}`;

      preparedItems.push({
        ...item,
        currentStock: item.openingStock,
        storeItemCode
      });
    }


        const savedItems = await Store.insertMany(preparedItems);
        res.status(201).json({
            success: true,
            message: "Bulk store items created successfully",
            count: savedItems.length,
            data: savedItems
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//  real Bulk Updated Function 
// controllers/storeController.js

exports.uploadStoreExcel = async (req, res) => {
  try {
    console.log("File received:", req.file);
    console.log("haa bAhi chl raha hun");
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Excel file is required"
      });
    }

    // Read excel buffer
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer"
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const excelData = XLSX.utils.sheet_to_json(worksheet);

    console.log(excelData)
    if (!excelData || excelData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel file is empty"
      });
    }

    // Total existing count from DB
    let totalItemsCount = await Store.countDocuments();

    const preparedItems = [];

    for (const row of excelData) {
      /*
        Expected Excel Headers:

        itemName
        category
        unit
        openingStock
        minimumStock
        rate
        location
        remarks
        hsnCode
        commodity
        mepHead
      */

      const categoryPrefix = row.category
        ? row.category.trim().charAt(0).toUpperCase()
        : "X";

      let mepPrefix = "XX";

      if (row.mepHead) {
        const mep = row.mepHead.trim().toLowerCase();

        if (mep === "electrical") {
          mepPrefix = "EL";
        } else {
          mepPrefix = row.mepHead
            .substring(0, 2)
            .toUpperCase();
        }
      }

      totalItemsCount++;

      const storeItemCode = `${categoryPrefix}${totalItemsCount}${mepPrefix}`;
      console.log(storeItemCode)

      preparedItems.push({
        itemName: row.itemName || "",
        category: row.category || "",
        unit: row.unit || "",
        openingStock: Number(row.openingStock || 0),
        currentStock: Number(row.openingStock || 0),
        minimumStock: Number(row.minimumStock || 0),
        rate: Number(row.rate || 0),
        location: row.location || "",
        remarks: row.remarks || "",
        hsnCode: row.hsnCode || "",
        commodity: row.commodity || "",
        mepHead: row.mepHead || "",
        storeItemCode
      });
    }

    const savedItems = await Store.insertMany(preparedItems);

    res.status(201).json({
      success: true,
      message: "Excel data uploaded successfully",
      totalInserted: savedItems.length,
      data: savedItems
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};