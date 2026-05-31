const StockTransaction = require("../model/StockTransaction");

const createStockTransaction = async ({
  itemRef,
  mainStoreRef = null,
  siteRef = null,
  transactionType,
  direction,
  quantity,
  beforeStock = 0,
  afterStock = 0,
  beforeReservedStock = 0,
  afterReservedStock = 0,
  rate = 0,
  referenceType,
  referenceId,
  referenceNumber = "",
  remarks = "",
  createdBy = null,
  session = null,
}) => {
  const amount = Number(quantity || 0) * Number(rate || 0);

  const transactionData = {
    itemRef,
    mainStoreRef,
    siteRef,
    transactionType,
    direction,
    quantity,
    beforeStock,
    afterStock,
    beforeReservedStock,
    afterReservedStock,
    rate,
    amount,
    referenceType,
    referenceId,
    referenceNumber,
    remarks,
    createdBy,
  };

  if (session) {
    return await StockTransaction.create([transactionData], { session });
  }

  return await StockTransaction.create(transactionData);
};

module.exports = createStockTransaction;