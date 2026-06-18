import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  FileText,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import BASE_URL from "../../config/api";
import ChallanPreview from "./ChallanPreview";
import ChallanItemPickerModal from "./ChallanItemPickerModal";

const CHALLAN_API = `${BASE_URL}/challan`;
const PROJECT_API = `${BASE_URL}/project-master/all`;
const STORE_API = `${BASE_URL}/store-master/all`;
const MAIN_STOCK_API = `${BASE_URL}/main-store-stock/live-stock`;
const SITE_STOCK_API = `${BASE_URL}/site-store-stock/live-stock`;

const DOCUMENT_TYPES = ["DC", "DDC", "LPN", "ISTN", "MRN", "MRS", "CN"];

const PURPOSES = [
  { value: "", label: "Select Type" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "MAIN ITEM", label: "MAIN ITEM" },
  { value: "ACCESSORIES", label: "ACCESSORIES" },
  { value: "TOOL", label: "Tool" },
  { value: "SAFETY", label: "Safety" },
  { value: "TEMPORARY_USE", label: "Temporary Use" },
  { value: "BOQ_INSTALLATION", label: "BOQ Installation" },
  { value: "OTHER", label: "Other" },
];

const emptyForm = {
  documentNumber: "",
  documentDate: new Date().toISOString().slice(0, 10),
  documentType: "DC",

  fromMainStoreRef: "",
  toMainStoreRef: "",

  fromSiteRef: "",
  toSiteRef: "",

  vendorRef: "",
  vendorName: "",

  projectRef: "",
  projectName: "",

  remarks: "",
};

const emptyItem = {
  itemRef: "",
  fromStockRef: "",
  toStockRef: "",

  itemName: "",
  itemCode: "",
  unit: "Nos",
  hsnCode: "",
  description: "",

  quantity: 1,
  rate: 0,
  amount: 0,

  itemPurpose: "CONSUMABLE",
  boqItemRef: "",
  boqRef: "",
  boqQty: 0,
  alreadyIssuedQty: 0,
  remainingBoqQty: 0,

  isReturnable: false,
  expectedReturnDate: "",


  stockError: "",
  remarks: "",
};

export default function ChallanModal({
  isOpen,
  onClose,
  mode = "add",
  challan,
  refreshChallans,
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isReChallan = mode === "rechallan";
  const isDirectView = mode === "directView";

  const title = isView
    ? "View Challan"
    : isEdit
      ? "Edit Challan"
      : isReChallan
        ? "Re-Challan / Copy Challan"
        : isDirectView
          ? "Direct view "
          : "Create Challan";

  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ ...emptyItem }]);

  const [projects, setProjects] = useState([]);
  const [stores, setStores] = useState([]);
  const [stockItems, setStockItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);

  const needsMainStore = ["DC", "MRN", "MRS", "CN"].includes(form.documentType);
  const needsFromMainStore = ["DC", "CN"].includes(form.documentType);
  const needsToMainStore = ["MRN", "MRS"].includes(form.documentType);

  const needsToSite = ["DC", "DDC", "LPN", "ISTN"].includes(form.documentType);
  const needsFromSite = ["ISTN", "MRS"].includes(form.documentType);
  const needsVendor = ["DDC", "LPN", "MRN", "CN"].includes(form.documentType);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowIndex, setPickerRowIndex] = useState(null);

  const [challanProject, setchallanProject] = useState({});

  // const title = isView ? "View Challan" : isEdit ? "Edit Challan" : "Create Challan";

  const authHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchProjects();
    fetchStores();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (challan) {
      // const selectedProject = projects.find(challan?.projectRef );
      // console.log(challan)

      const selectedProject = projects.find((p) => p._id === challan.projectRef);

      setchallanProject(selectedProject || challan.projectRef || challan.toSiteRef || {});

      setForm({
        documentNumber: challan.documentNumber || "",
        documentDate: challan.documentDate
          ? challan.documentDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        documentType: challan.documentType || "DC",

        fromMainStoreRef:
          challan.fromMainStoreRef?._id || challan.fromMainStoreRef || "",
        toMainStoreRef:
          challan.toMainStoreRef?._id || challan.toMainStoreRef || "",

        fromSiteRef: challan.fromSiteRef?._id || challan.fromSiteRef || "",
        toSiteRef: challan.toSiteRef?._id || challan.toSiteRef || "",

        vendorRef: challan.vendorRef?._id || challan.vendorRef || "",
        vendorName: challan.vendorName || "",

        projectRef:
          challan.projectRef?._id ||
          challan.projectRef ||
          challan.toSiteRef?._id ||
          challan.toSiteRef ||
          "",
        projectName:
          challan.projectName ||
          challan.projectRef?.projectName ||
          challan.projectRef?.name ||
          challan.toSiteRef?.projectName ||
          challan.toSiteRef?.name ||
          "",

        remarks: challan.remarks || "",
      });

      setItems(
        challan.items?.length
          ? challan.items.map((item) => ({
            itemRef: item.itemRef?._id || item.itemRef || "",
            fromStockRef: item.fromStockRef?._id || item.fromStockRef || "",
            toStockRef: item.toStockRef?._id || item.toStockRef || "",

            itemName: item.itemName || item.itemRef?.itemName || "",
            itemCode: item.itemCode || item.itemRef?.itemCode || "",
            unit: item.unit || "Nos",
            hsnCode: item.hsnCode || "",
            description: item.description || item.itemName || "",

            quantity: Number(item.quantity || 1),
            rate: Number(item.rate || 0),
            amount: Number(item.amount || 0),

            itemPurpose: item.itemPurpose || "CONSUMABLE",
            boqItemRef: item.boqItemRef?._id || item.boqItemRef || "",
            boqRef: item.boqRef?._id || item.boqRef || "",
            boqQty: Number(item.boqQty || 0),
            alreadyIssuedQty: Number(item.alreadyIssuedQty || 0),
            remainingBoqQty: Number(item.remainingBoqQty || 0),

            isReturnable: Boolean(item.isReturnable),
            expectedReturnDate: item.expectedReturnDate
              ? item.expectedReturnDate.slice(0, 10)
              : "",

            stockError: "",
            remarks: item.remarks || "",
          }))
          : [{ ...emptyItem }]
      );

      const storeId =
        challan.fromMainStoreRef?._id || challan.fromMainStoreRef || "";
      if (storeId) fetchItemsByMainStore(storeId);
    } else {
      setForm(emptyForm);
      setItems([{ ...emptyItem }]);
      setStockItems([]);
    }
  }, [challan, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (["DC", "CN"].includes(form.documentType) && form.fromMainStoreRef) {
      fetchItemsByMainStore(form.fromMainStoreRef);
      return;
    }

    if (["ISTN", "MRS"].includes(form.documentType) && form.fromSiteRef) {
      fetchItemsBySite(form.fromSiteRef);
      return;
    }
  }, [isOpen, form.fromMainStoreRef, form.fromSiteRef, form.documentType]);

  //  For the challan Number Predict
  useEffect(() => {
  if (isEdit || isView || challan) return;

  const projectId =
    form.toSiteRef ||
    form.fromSiteRef ||
    form.projectRef;

  if (!projectId || !form.documentType) return;

  generateChallanNumber(projectId, form.documentType);

}, [
  form.toSiteRef,
  form.fromSiteRef,
  form.projectRef,
  form.documentType,
]);

  if (!isOpen) return null;

  const fetchProjects = async () => {
    try {
      const res = await axios.get(PROJECT_API);
      setProjects(res.data.data || []);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get(STORE_API);
      setStores(res.data.data || []);
    } catch {
      toast.error("Failed to load stores");
    }
  };

  const fetchItemsByMainStore = async (mainStoreRef) => {
    try {
      setItemLoading(true);
      const res = await axios.get(`${MAIN_STOCK_API}?mainStoreRef=${mainStoreRef}`);
      setStockItems(res.data.data || []);
    } catch {
      toast.error("Failed to load available stock items");
    } finally {
      setItemLoading(false);
    }
  };

  const fetchItemsBySite = async (siteRef) => {
    try {
      setItemLoading(true);

      const res = await axios.get(`${SITE_STOCK_API}?siteRef=${siteRef}`);

      setStockItems(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load site stock items");
    } finally {
      setItemLoading(false);
    }
  };

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [items]
  );


const generateChallanNumber = async (
  projectId,
  documentType
) => {
  try {
    if (!projectId || !documentType) return;

    const res = await axios.get(
      `${CHALLAN_API}/number`,
      {
        params: {
          projectRef: projectId,
          documentType,
        },
      }
    );

    setForm((prev) => ({
      ...prev,
      documentNumber: res.data.documentNumber,
    }));
  } catch (error) {
    console.error(error);
  }
};
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "documentType") {
      setForm((prev) => ({
        ...emptyForm,
        documentNumber: prev.documentNumber,
        documentDate: prev.documentDate,
        documentType: value,
      }));
      setItems([{ ...emptyItem }]);
      setStockItems([]);
      return;
    }

    if (name === "toSiteRef" || name === "fromSiteRef" || name === "projectRef") {
      const selectedProject = projects.find((p) => p._id === value);
      setchallanProject(selectedProject)

      // console.log(challanProject);
      // setSelectedProjectForChallan(selectedProject);
      // console.log("Selected Project For challan:",selectedProjectForChallan);

      setForm((prev) => ({
        ...prev,
        [name]: value,
        projectRef:
          name === "toSiteRef" || name === "fromSiteRef"
            ? value
            : prev.projectRef,
        projectName:
          selectedProject?.projectName ||
          selectedProject?.name ||
          prev.projectName,

      }));

      setItems([{ ...emptyItem }]);
      setStockItems([]);

      if (name === "fromSiteRef" && ["ISTN", "MRS"].includes(form.documentType)) {
        fetchItemsBySite(value);
      }

      return;
    }

    if (name === "fromMainStoreRef") {
      setForm((prev) => ({ ...prev, fromMainStoreRef: value }));
      setItems([{ ...emptyItem }]);
      setStockItems([]);
      if (value) fetchItemsByMainStore(value);
      return;
    }
    
    

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const extractStockItem = (stock) => {
    const item = stock.itemRef || {};
    return {
      stockId: stock._id,
      itemId: item._id || stock.itemRef,
      itemName: item.itemName || "",
      itemCode: item.itemCode || "",
      unit: item.unit || "Nos",
      hsnCode: item.hsnCode || "",
      description: item.description || item.specification || item.itemName || "",
      rate: Number(stock.averageRate || 0),
      availableStock: Number(stock.availableStock || 0),
    };
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (field === "itemPurpose") {
      updated[index].isReturnable = value === "TOOL";
      updated[index].boqItemRef = "";
      updated[index].boqRef = "";
    }

    if (field === "itemRef") {
      const selectedStock = stockItems.find((stock) => {
        const itemId = stock.itemRef?._id || stock.itemRef;
        return itemId === value;
      });

      if (selectedStock) {
        const selected = extractStockItem(selectedStock);

        updated[index] = {
          ...updated[index],
          itemRef: selected.itemId,
          fromStockRef: selected.stockId,
          itemName: selected.itemName,
          itemCode: selected.itemCode,
          unit: selected.unit,
          hsnCode: selected.hsnCode,
          description: selected.description,
          rate: selected.rate,
          quantity: 1,
          amount: selected.rate,
          stockError: "",
        };
      }
    }

    if (field === "quantity" || field === "rate") {
      updated[index].amount =
        Number(updated[index].quantity || 0) * Number(updated[index].rate || 0);
    }

    if (field === "quantity") {
      const selectedStock = stockItems.find((stock) => {
        const itemId = stock.itemRef?._id || stock.itemRef;
        return itemId === updated[index].itemRef;
      });

      if (
        selectedStock &&
        ["DC", "CN"].includes(form.documentType) &&
        Number(value) > Number(selectedStock.availableStock || 0)
      ) {
        updated[index].stockError = `Only ${selectedStock.availableStock} ${selectedStock.itemRef?.unit || ""
          } available`;
      } else {
        updated[index].stockError = "";
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!form.documentNumber.trim()) {
      toast.error("Document number is required");
      return false;
    }

    if (!form.documentDate) {
      toast.error("Document date is required");
      return false;
    }

    if (needsFromMainStore && !form.fromMainStoreRef) {
      toast.error("From main store is required");
      return false;
    }

    if (needsToMainStore && !form.toMainStoreRef) {
      toast.error("To main store is required");
      return false;
    }

    if (needsFromSite && !form.fromSiteRef) {
      toast.error("From site is required");
      return false;
    }

    if (needsToSite && !form.toSiteRef) {
      toast.error("To site is required");
      return false;
    }

    if (needsVendor && !form.vendorName.trim()) {
      toast.error("Vendor name is required");
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemRef) {
        toast.error(`Select item in row ${i + 1}`);
        return false;
      }

      if (Number(items[i].quantity) <= 0) {
        toast.error(`Quantity must be greater than 0 in row ${i + 1}`);
        return false;
      }

      if (
        items[i].itemPurpose === "TOOL" &&
        items[i].isReturnable &&
        !items[i].expectedReturnDate
      ) {
        toast.error(`Expected return date required for tool in row ${i + 1}`);
        return false;
      }

      if (items[i].stockError) {
        toast.error(items[i].stockError);
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    return {
      documentNumber: form.documentNumber,
      documentDate: form.documentDate,
      documentType: form.documentType,

      materialRequisitionRef: challan?.materialRequisitionRef || null,
      procurementPlanRef: challan?.procurementPlanRef || null,
      procurementItemId: challan?.procurementItemId || null,
      procurementItemIds: challan?.procurementItemIds || [],

      fromMainStoreRef: form.fromMainStoreRef || null,
      toMainStoreRef: form.toMainStoreRef || null,

      fromSiteRef: form.fromSiteRef || null,
      toSiteRef: form.toSiteRef || null,

      vendorRef: form.vendorRef || null,
      vendorName: form.vendorName,

      projectRef: form.projectRef || form.toSiteRef || form.fromSiteRef || null,
      projectName: form.projectName,

      remarks: form.remarks,

      items: items.map((item) => ({
        itemRef: item.itemRef,
        fromStockRef: item.fromStockRef || null,
        toStockRef: item.toStockRef || null,

        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        hsnCode: item.hsnCode,

        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        amount: Number(item.amount || 0),

        itemPurpose: item.itemPurpose,
        boqItemRef: item.boqItemRef || null,
        boqRef: item.boqRef || null,
        boqQty: Number(item.boqQty || 0),
        alreadyIssuedQty: Number(item.alreadyIssuedQty || 0),
        remainingBoqQty: Number(item.remainingBoqQty || 0),

        isReturnable: Boolean(item.isReturnable),
        expectedReturnDate: item.expectedReturnDate || null,

        remarks: item.remarks || "",
      })),
    };
  };

  const saveChallan = async () => {
    if (!validate()) return;


    try {
      setLoading(true);
      const payload = buildPayload();

      if (isEdit) {

        await axios.put(`${CHALLAN_API}/update-before-approval/${challan._id}`, payload, authHeader);
        toast.success("Challan updated successfully");
      } else {
        await axios.post(`${CHALLAN_API}/create`, payload, authHeader);
        toast.success("Challan created for approval");
      }

      refreshChallans?.();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save challan");
    } finally {
      setLoading(false);
    }
  };

  //  For Picker Modal
  const openItemPicker = () => {
    // setPickerRowIndex(index);
    setPickerOpen(true);
  };

  const hasError = items.some((item) => item.stockError);
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 text-slate-100">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <PackageCheck size={14} />
              Approval Based Digital Challan
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <Input
            label="Document Number *"
            name="documentNumber"
            value={form.documentNumber}
            onChange={handleFormChange}
            disabled={isView || isEdit}
            // disabled={isView }
          />

          <Input
            label="Document Date *"
            type="date"
            name="documentDate"
            value={form.documentDate}
            onChange={handleFormChange}
            disabled={isView}
          />

          <SelectBox
            label="Document Type *"
            name="documentType"
            value={form.documentType}
            onChange={handleFormChange}
            disabled={isView}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </SelectBox>

          {needsFromMainStore && (
            <SelectBox
              label="From Main Store *"
              name="fromMainStoreRef"
              value={form.fromMainStoreRef}
              onChange={handleFormChange}
              disabled={isView}
            >
              <option value="">Select Main Store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.storeName} - {store.storeCode}
                </option>
              ))}
            </SelectBox>
          )}

          {needsToMainStore && (
            <SelectBox
              label="To Main Store *"
              name="toMainStoreRef"
              value={form.toMainStoreRef}
              onChange={handleFormChange}
              disabled={isView}
            >
              <option value="">Select Main Store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.storeName} - {store.storeCode}
                </option>
              ))}
            </SelectBox>
          )}

          {needsFromSite && (
            <SelectBox
              label="From Site *"
              name="fromSiteRef"
              value={form.fromSiteRef}
              onChange={handleFormChange}
              disabled={isView}
            >
              <option value="">Select Site</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectName || project.name}
                </option>
              ))}
            </SelectBox>
          )}

          {needsToSite && (
            <SelectBox
              label="To Site *"
              name="toSiteRef"
              value={form.toSiteRef}
              onChange={handleFormChange}
              disabled={isView}
            >
              <option value="">Select Site</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.projectName || project.name}
                </option>
              ))}
            </SelectBox>
          )}

          {needsVendor && (
            <Input
              label="Vendor Name *"
              name="vendorName"
              value={form.vendorName}
              onChange={handleFormChange}
              disabled={isView}
            />
          )}

          <Input
            label="Project Name"
            name="projectName"
            value={form.projectName}
            onChange={handleFormChange}
            disabled
          />

          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleFormChange}
              disabled={isView}
              rows={2}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
            />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Items</h3>
              <p className="text-xs text-slate-500">
                BOQ items, consumables, tools and safety material can be added here.
              </p>
            </div>

            {!isView && (
              <button
                onClick={openItemPicker}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                <Plus size={17} />
                Select Multiple Items
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-sm">
                <thead className="bg-slate-900 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3 text-left">Purpose</th>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">HSN</th>
                    <th className="p-3 text-left">Qty</th>
                    <th className="p-3 text-left">Unit</th>
                    <th className="p-3 text-left">Rate</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Returnable</th>
                    <th className="p-3 text-left">Return Date</th>
                    <th className="p-3 text-left">Remarks</th>
                    {!isView && <th className="p-3 text-center">Action</th>}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {items.map((item, index) => (
                    <tr key={index} className="bg-slate-950/60">
                      <td className="p-3">
                        <select
                          value={item.itemPurpose}
                          disabled={isView}
                          onChange={(e) =>
                            handleItemChange(index, "itemPurpose", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500"
                        >
                          {PURPOSES.map((purpose) => (
                            <option key={purpose.value} value={purpose.value}>
                              {purpose.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* <td className="p-3">
                        <select
                          value={item.itemRef}
                          disabled={
                            isView ||
                            (["DC", "CN"].includes(form.documentType) &&
                              !form.fromMainStoreRef)
                          }
                          onChange={(e) =>
                            handleItemChange(index, "itemRef", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500"
                        >
                          <option value="">
                            {itemLoading ? "Loading..." : "Select Item"}
                          </option>

                          {item.itemRef && item.itemName && (
                            <option value={item.itemRef}>{item.itemName}</option>
                          )}

                          {stockItems.map((stock) => {
                            const itemData = stock.itemRef || {};
                            return (
                              <option
                                key={stock._id}
                                value={itemData._id || stock.itemRef}
                              >
                                {itemData.itemName} — Avl: {stock.availableStock}{" "}
                                {itemData.unit}
                              </option>
                            );
                          })}
                        </select>

                        {item.stockError && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle size={12} />
                            {item.stockError}
                          </p>
                        )}
                      </td> */}
                      {/* Select item use ItemPicker */}
                      <td>
                        <button
                          type="button"
                          onClick={() => openItemPicker(index)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-white hover:border-cyan-500"
                        >
                          {item.itemName ? (
                            <div>
                              <div>{item.itemName}</div>
                              <div className="text-xs text-cyan-300">
                                {item.itemCode}
                              </div>
                            </div>
                          ) : (
                            "🔍 Search / Select Item"
                          )}
                        </button>
                      </td>

                      <TdInput
                        value={item.itemCode}
                        disabled
                        onChange={(e) =>
                          handleItemChange(index, "itemCode", e.target.value)
                        }
                      />

                      <TdInput
                        value={item.hsnCode}
                        // disabled={isView}
                        disabled
                        onChange={(e) =>
                          handleItemChange(index, "hsnCode", e.target.value)
                        }
                      />

                      <TdInput
                        type="number"
                        value={item.quantity}
                        disabled={isView}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", Number(e.target.value))
                        }
                      />

                      <TdInput
                        value={item.unit}
                        // disabled={isView}
                        disabled
                        onChange={(e) =>
                          handleItemChange(index, "unit", e.target.value)
                        }
                      />

                      <TdInput
                        type="number"
                        value={item.rate}
                        disabled={isView}
                        onChange={(e) =>
                          handleItemChange(index, "rate", Number(e.target.value))
                        }
                      />

                      <td className="p-3 font-semibold text-white">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={item.isReturnable}
                          disabled={isView || item.itemPurpose === "TOOL"}
                          onChange={(e) =>
                            handleItemChange(index, "isReturnable", e.target.checked)
                          }
                          className="h-4 w-4 accent-cyan-500"
                        />
                      </td>

                      <TdInput
                        type="date"
                        value={item.expectedReturnDate}
                        disabled={isView || !item.isReturnable}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "expectedReturnDate",
                            e.target.value
                          )
                        }
                      />

                      <TdInput
                        value={item.remarks}
                        disabled={isView}
                        onChange={(e) =>
                          handleItemChange(index, "remarks", e.target.value)
                        }
                      />

                      {!isView && (
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeItemRow(index)}
                            className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4">
              <p className="text-sm text-slate-400">Total Amount</p>
              <h3 className="mt-1 text-2xl font-bold text-cyan-300">
                ₹{totalAmount.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-800 bg-slate-950/95 px-6 py-4 backdrop-blur">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            {isView ? "Close" : "Cancel"}
          </button>

          {!isView && (
            <>
              <button
                onClick={() => {
                  if (!validate()) return;
                  setPreviewOpen(true);
                }}
                disabled={loading || hasError}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText size={18} />
                Preview Challan
              </button>

              <button
                onClick={saveChallan}
                disabled={loading || hasError}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={18} />
                )}
                {isEdit ? "Update Challan" : "Create For Approval"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* DIrect Open View  */}
      {
        isDirectView  && (
           <ChallanPreview
          formData={form}
          items={items}
          totalAmount={totalAmount}
          onBack={onClose }
          
          onConfirm={saveChallan}
          challanProject={challanProject}
          mode ="directView"
        />
        )
      }

      {previewOpen && (
        <ChallanPreview
          formData={form}
          items={items}
          totalAmount={totalAmount}
          onBack={() => setPreviewOpen(false)}
          onConfirm={saveChallan}
          challanProject={challanProject}
        // allotedCompany={projects}
        />
      )}

      {pickerOpen && (
        <ChallanItemPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          documentType={form.documentType}
          fromMainStoreRef={form.fromMainStoreRef}
          fromSiteRef={form.fromSiteRef}
          onSelect={(selectedRows) => {
            setItems((prev) => {
              const cleanPrev =
                prev.length === 1 && !prev[0].itemRef ? [] : prev;

              const existingIds = new Set(cleanPrev.map((x) => x.itemRef));

              const uniqueRows = selectedRows.filter(
                (row) => !existingIds.has(row.itemRef)
              );

              return [...cleanPrev, ...uniqueRows];
            });

            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Input({ label, type = "text", name, value, onChange, disabled }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
      />
    </div>
  );
}

function SelectBox({ label, name, value, onChange, disabled, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
      >
        {children}
      </select>
    </div>
  );
}

function TdInput({ type = "text", value, onChange, disabled }) {
  return (
    <td className="p-3">
      <input
        type={type}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500 disabled:bg-slate-800 disabled:text-slate-400"
      />
    </td>
  );
}