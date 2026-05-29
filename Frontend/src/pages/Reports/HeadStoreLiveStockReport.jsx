import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Search,
  Package,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Truck,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../../config/api";
import * as XLSX from "xlsx";
export default function HeadStoreLiveStockReport() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [returnFromSites, setReturnFromSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stockModalOpen, setStockModalOpen] = useState(false);

  //Mis Leading Store Items
  const [overIssuedItems, setOverIssuedItems] = useState([]);
  const [shortageModalOpen, setShortageModalOpen] = useState(false);


  const fetchReport = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${BASE_URL}/head-store/received-items`
      );

      const receivedItems = res.data.items || [];
      const backendSummary = res.data.summary || {};


      setItems(receivedItems);
      setReturnFromSites([]);
      // Set Misleading Items
      setOverIssuedItems(res.data.overIssuedItems || []);

      // const totalMrnValue = receivedItems.reduce(
      //   (sum, item) => sum + Number(item.totalAmountMRN || 0),
      //   0
      // );

      // const totalMrsValue = receivedItems.reduce(
      //   (sum, item) => sum + Number(item.totalAmountMRS || 0),
      //   0
      // );

      // const totalOutValue = receivedItems.reduce(
      //   (sum, item) => sum + Number(item.totalAmountOutDC || 0),
      //   0
      // );
      // const totalOpeningStockValue=receivedItems.reduce(
      //     (sum, item) => sum + Number(item.openingStockAmount || 0),
      //   0
      // )

      // const currentStoreStockValue =
      //   totalOpeningStockValue +
      //   totalMrnValue +
      //   totalMrsValue -
      //   totalOutValue;

      setSummary({
        totalUniqueItems: res.data.totalItems || receivedItems.length,

        vendorInQty: receivedItems.reduce(
          (sum, item) => sum + Number(item.vendorInQty || 0),
          0
        ),

        siteReturnQty: receivedItems.reduce(
          (sum, item) => sum + Number(item.siteReturnQty || 0),
          0
        ),

        storeOutQty: receivedItems.reduce(
          (sum, item) => sum + Number(item.storeOutQty || 0),
          0
        ),

        openingStockValue: backendSummary.totalOpeningStockValue,
        totalMrnValue: backendSummary.totalMrnValue,
        totalMrsValue: backendSummary.totalMrsValue,
        totalOutValue: backendSummary.totalDCValue,

        currentStoreStockValue: backendSummary.totalCurrentStockValue,

        // mis leading items 
        negativeStockItems: backendSummary.negativeStockItems || 0,
        totalNegativeQty: backendSummary.totalNegativeQty || 0,
        totalNegativeStockValue:
          backendSummary.totalNegativeStockValue || 0,
      });
    } catch (error) {
      console.error("Head store stock error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.itemName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);



  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <button
        onClick={() => navigate("/reports/material-summary")}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
      >
        <ArrowLeft size={18} />
        Back to Material Summary
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div>
          <p className="text-sm text-purple-400 font-semibold">
            Head Store Intelligence
          </p>
          <h1 className="text-3xl font-bold mt-1">
            Head Store Live Stock
          </h1>
          <p className="text-slate-400 mt-2">
            Available stock = Opening Stock + MRN vendor inward + MRS site return - DC store outward.
          </p>
        </div>

        <div className="relative w-full lg:w-96">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item..."
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        {/* <Stat icon={Package} title="Unique Items" value={num(summary.totalUniqueItems)} /> */}
        {/* <Stat icon={ArrowDownCircle} title="Vendor In MRN" value={num(summary.vendorInQty)} tone="emerald" /> */}
        {/* <Stat icon={RotateCcw} title="Site Return MRS" value={num(summary.siteReturnQty)} tone="cyan" /> */}
        {/* <Stat icon={ArrowUpCircle} title="Store Out DC" value={num(summary.storeOutQty)} tone="red" /> */}
        {/* Opening Stock */}

        <Stat
          icon={IndianRupee}
          title="opening Stock Value"
          value={`₹ ${num(summary.openingStockValue)}`}
          tone="green"
        />
        {/* MRN Value// */}

        <Stat
          icon={IndianRupee}
          title="MRN Value"
          value={`₹ ${num(summary.totalMrnValue)}`}
          tone="green"
        />
        {/* MRS Value */}
        <Stat
          icon={IndianRupee}
          title="MRS Value"
          value={`₹ ${num(summary.totalMrsValue)}`}
          tone="green"
        />
        {/* MRN Value */}
        <Stat
          icon={IndianRupee}
          title="Total DC  Value"
          value={`₹ ${num(summary.totalOutValue)}`}
          tone="green"
        />
        {/* MRS Value
         <Stat
          icon={IndianRupee}
          title="MRN Value"
          value={`₹ ${num(summary.totalMrsValue)}`}
          tone="green"
        /> */}
        <Stat
          icon={IndianRupee}
          title="Live Stock Value"
          value={`₹ ${num(summary.currentStoreStockValue)}`}
          tone="green"
          onClick={() => setStockModalOpen(true)}
        />

        {/*  Misleading Items stat */}
        <Stat
          icon={ArrowUpCircle}
          title="Shortage / Misleading"
          value={num(summary.negativeStockItems)}
          tone="red"
          onClick={() => setShortageModalOpen(true)}
        />

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-4">Item-wise Head Store Stock</h2>

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              <Loader2 className="animate-spin inline mr-2" />
              Loading head store stock...
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-slate-500">No item found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item, index) => (
                <ItemCard key={index} item={item} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-semibold mb-4">Top Site Returns</h2>

          {returnFromSites.length === 0 ? (
            <p className="text-slate-500">No site return data found.</p>
          ) : (
            <div className="space-y-3">
              {returnFromSites.map((site) => (
                <div
                  key={site.projectName}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3"
                >
                  <p className="font-medium text-sm">{site.projectName}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <Mini label="Return Qty" value={num(site.returnQty)} tone="text-cyan-400" />
                    <Mini label="Items" value={num(site.totalReturnedItems)} />
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    Return Value:{" "}
                    <span className="text-emerald-400 font-semibold">
                      ₹ {num(site.returnValue)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {stockModalOpen && (
        <CurrentStockModal
          items={items}
          summary={summary}
          onClose={() => setStockModalOpen(false)}
        />
      )}
      {shortageModalOpen && (
        <ShortageModal
          items={overIssuedItems}
          summary={summary}
          onClose={() => setShortageModalOpen(false)}
        />
      )}

    </div>
  );
}

function ItemCard({ item }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-purple-500 transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2">
            {item.itemName || "N/A"}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {item.recordsCount || 0} movement records
          </p>
        </div>

        <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 whitespace-nowrap">
          {item.uom || "-"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <Mini label="Vendor MRN" value={num(item.vendorInQty)} tone="text-emerald-400" />
        <Mini label="Site MRS" value={num(item.siteReturnQty)} tone="text-cyan-400" />
        <Mini label="Opening Stock" value={num(item.openingStock)} tone="text-cyan-400" />
        <Mini label="Out DC" value={num(item.storeOutQty)} tone="text-red-400" />
        <Mini label="Available" value={num(item.availableQty)} tone="text-purple-400" />
        <Mini label="Avg Cost Rate" value={`₹ ${num(item.avgCostRate)}`} />
        <Mini label="Issue Rate" value={`₹ ${num(item.storeIssueRate)}`} />
        <Mini label="Profit / Unit" value={`₹ ${num(item.profitPerUnit)}`} />
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Current Stock Value:</span>
          <b className="text-emerald-400">
            ₹ {num(item.currentStoreStockValue)}
          </b>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Total Cost Amount:</span>
          <b className="text-slate-300">
            ₹ {num(item.totalCostAmount)}
          </b>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, title, value, tone = "blue", onClick }) {
  const tones = {
    blue: "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    red: "text-red-400 bg-red-500/10",
    green: "text-green-400 bg-green-500/10",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 ${onClick ? "cursor-pointer hover:border-green-500 transition" : ""
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs">{title}</p>
          <h3 className="text-lg font-bold mt-1">{value}</h3>
        </div>

        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones[tone] || tones.blue
            }`}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone = "text-slate-200" }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
      <p className="text-slate-500">{label}</p>
      <p className={`font-semibold mt-1 ${tone}`}>{value}</p>
    </div>
  );
}

function num(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function CurrentStockModal({ items, summary, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [materialType, setMaterialType] = useState("All");

  const getMaterialType = (item) => {
    const type = item.category || "Unclassified";
    return type.trim();
  };

  const availableItems = items.filter(
    (item) => Number(item.availableQty || 0) > 0
  );

  const getCategorySummary = (categoryName) => {
    const list = availableItems.filter(
      (item) =>
        getMaterialType(item).toLowerCase() === categoryName.toLowerCase()
    );

    return {
      count: list.length,
      qty: list.reduce(
        (sum, item) => sum + Number(item.availableQty || 0),
        0
      ),
      value: list.reduce(
        (sum, item) => sum + Number(item.currentStoreStockValue || 0),
        0
      ),
    };
  };

  const mainItemSummary = getCategorySummary("Main Item");
  const accessoriesSummary = getCategorySummary("Accessories");
  const consumableSummary = getCategorySummary("Consumable");
  const toolSummary = getCategorySummary("Tool");
  const officeAssetSummary = getCategorySummary("Office Assets");
  const safetySummary = getCategorySummary("Safety Equipments");
  const ppeSummary = getCategorySummary("PPE");

  const materialTypes = [
    "All",
    ...new Set(availableItems.map((item) => getMaterialType(item))),
  ];

  const filteredItems = availableItems.filter((item) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      item.itemName?.toLowerCase().includes(keyword) ||
      item.storeItemCode?.toLowerCase().includes(keyword) ||
      item.category?.toLowerCase().includes(keyword) ||
      item.uom?.toLowerCase().includes(keyword) ||
      item.hsnCode?.toLowerCase().includes(keyword) ||
      item.boqNo?.toLowerCase().includes(keyword);

    const matchesType =
      materialType === "All" || getMaterialType(item) === materialType;

    return matchesSearch && matchesType;
  });

  const totalAvailableQty = filteredItems.reduce(
    (sum, item) => sum + Number(item.availableQty || 0),
    0
  );

  const totalStockValue = filteredItems.reduce(
    (sum, item) => sum + Number(item.currentStoreStockValue || 0),
    0
  );

  const allStockValue = availableItems.reduce(
    (sum, item) => sum + Number(item.currentStoreStockValue || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-7xl max-h-[92vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Current Available Stock Items
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Category-wise stock breakup with available quantity and value.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-5 border-b border-slate-800 space-y-4">
          {/* Main Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Stat
              icon={Package}
              title="Available Items"
              value={num(availableItems.length)}
              tone="green"
            />

            <Stat
              icon={ArrowDownCircle}
              title="Available Qty"
              value={num(
                availableItems.reduce(
                  (sum, item) => sum + Number(item.availableQty || 0),
                  0
                )
              )}
              tone="emerald"
            />

            <Stat
              icon={IndianRupee}
              title="Total Stock Value"
              value={`₹ ${num(summary.currentStoreStockValue)}`}
              tone="green"
            />

            {/* <Stat
              icon={Package}
              title="Filtered Items"
              value={num(filteredItems.length)}
              tone="blue"
            /> */}
          </div>

          {/* Category Breakup */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <BreakupCard title="Main Item" data={mainItemSummary} tone="blue" />
            <BreakupCard title="Accessories" data={accessoriesSummary} tone="cyan" />
            <BreakupCard title="Consumable" data={consumableSummary} tone="emerald" />
            <BreakupCard title="Tool" data={toolSummary} tone="purple" />
            <BreakupCard title="Office Assets" data={officeAssetSummary} tone="orange" />
            <BreakupCard title="Safety Equipments" data={safetySummary} tone="red" />
            <BreakupCard title="PPE" data={ppeSummary} tone="yellow" />
          </div>

          {/* Search + Filter */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item name, code, category, HSN, BOQ..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
            >
              {materialTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Result Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Mini
              label="Filtered Available Qty"
              value={num(totalAvailableQty)}
              tone="text-purple-400"
            />

            <Mini
              label="Filtered Stock Value"
              value={`₹ ${num(totalStockValue)}`}
              tone="text-green-400"
            />

            <Mini
              label="Selected Type"
              value={materialType}
              tone="text-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[48vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 text-slate-300 z-10">
              <tr>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Code</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Opening</th>
                <th className="text-right p-3">MRN</th>
                <th className="text-right p-3">MRS</th>
                <th className="text-right p-3">Out</th>
                <th className="text-right p-3">Available</th>
                <th className="text-right p-3">Rate</th>
                <th className="text-right p-3">Stock Value</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-6 text-center text-slate-500">
                    No available stock found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const availableQty = Number(item.availableQty || 0);
                  const stockValue = Number(item.currentStoreStockValue || 0);
                  const type = getMaterialType(item);

                  return (
                    <tr
                      key={index}
                      className="border-b border-slate-800 hover:bg-slate-900/70"
                    >
                      <td className="p-3 min-w-[260px]">
                        <p className="font-medium text-white">
                          {item.itemName || "N/A"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.category || "-"} {item.uom ? `• ${item.uom}` : ""}
                        </p>
                      </td>

                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        {item.storeItemCode || "-"}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 whitespace-nowrap">
                          {type}
                        </span>
                      </td>

                      <td className="p-3 text-right text-green-400">
                        {num(item.openingStock)}
                      </td>

                      <td className="p-3 text-right text-emerald-400">
                        {num(item.vendorInQty)}
                      </td>

                      <td className="p-3 text-right text-cyan-400">
                        {num(item.siteReturnQty)}
                      </td>

                      <td className="p-3 text-right text-red-400">
                        {num(item.storeOutQty)}
                      </td>

                      <td className="p-3 text-right font-semibold text-purple-400">
                        {num(availableQty)}
                      </td>

                      <td className="p-3 text-right text-slate-300">
                        ₹ {num(item.fixedUnitRate || item.avgCostRate)}
                      </td>

                      <td className="p-3 text-right font-semibold text-green-400">
                        ₹ {num(stockValue)}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">
                          Available
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BreakupCard({ title, data, tone = "blue" }) {
  const tones = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    orange: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div className={`rounded-xl border p-3 ${tones[tone] || tones.blue}`}>
      <p className="text-xs font-semibold">{title}</p>

      <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <div>
          <p className="opacity-70">Items</p>
          <p className="font-bold text-white mt-1">{num(data.count)}</p>
        </div>

        <div>
          <p className="opacity-70">Qty</p>
          <p className="font-bold text-white mt-1">{num(data.qty)}</p>
        </div>

        <div>
          <p className="opacity-70">Value</p>
          <p className="font-bold text-white mt-1">₹ {num(data.value)}</p>
        </div>
      </div>
    </div>
  );
}


function ShortageModal({ items, summary, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((item) => {
    const keyword = searchTerm.toLowerCase();

    return (
      item.itemName?.toLowerCase().includes(keyword) ||
      item.storeItemCode?.toLowerCase().includes(keyword) ||
      item.hsnCode?.toLowerCase().includes(keyword) ||
      item.boqNo?.toLowerCase().includes(keyword) ||
      item.lastDocumentNo?.toLowerCase().includes(keyword)
    );
  });

  //  Export shortage material 
  const exportShortageReport = () => {
    const exportData = filteredItems.map((item, index) => ({
      "S.No": index + 1,
      "Item Name": item.itemName || "",
      "Store Item Code": item.storeItemCode || "",
      "UOM": item.uom || "",
      "HSN Code": item.hsnCode || "",
      "Opening Stock": Number(item.openingStock || 0),
      "MRN Qty": Number(item.vendorInQty || 0),
      "MRS Qty": Number(item.siteReturnQty || 0),
      "Total Out Qty": Number(item.storeOutQty || 0),
      "Available Qty": Number(item.availableQty || 0),
      "Shortage Qty": Number(item.shortageQty || 0),
      "Average Rate": Number(item.avgCostRate || 0),
      "Negative Stock Value": Number(item.negativeStockValue || 0),
      "Last Document No": item.lastDocumentNo || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortage Report");

    XLSX.writeFile(
      workbook,
      `Head_Store_Shortage_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-red-500/30 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Shortage / Misleading Stock Items
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              These items have more outward quantity than available stock.
            </p>
          </div>

          <div className=" flex items-right gap-10">
            <button
              onClick={exportShortageReport}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition"
            >
              Export Excel
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

        </div>

        <div className="p-5 border-b border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Mini
              label="Misleading Items"
              value={num(summary.negativeStockItems)}
              tone="text-red-400"
            />

            <Mini
              label="Total Shortage Qty"
              value={num(summary.totalNegativeQty)}
              tone="text-red-400"
            />

            <Mini
              label="Showing Records"
              value={num(filteredItems.length)}
              tone="text-orange-400"
            />
            <Mini
              label="Negative Stock Value"
              value={`₹ ${num(summary.totalNegativeStockValue)}`}
              tone="text-red-400"
            />
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shortage item..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="overflow-auto max-h-[55vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 text-slate-300 z-10">
              <tr>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Code</th>
                <th className="text-right p-3">Opening</th>

                <th className="text-right p-3">MRN</th>
                <th className="text-right p-3">MRS</th>
                <th className="text-right p-3">Out</th>
                <th className="text-right p-3">Available</th>
                <th className="text-right p-3">Shortage</th>
                <th className="text-right p-3">Negative Value</th>

                <th className="text-left p-3">Last Doc</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-500">
                    No shortage item found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-800 hover:bg-red-500/5"
                  >
                    <td className="p-3 min-w-[260px]">
                      <p className="font-medium text-white">
                        {item.itemName || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.uom || "-"} {item.hsnCode ? `• HSN ${item.hsnCode}` : ""}
                      </p>
                    </td>

                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      {item.storeItemCode || "-"}
                    </td>

                    <td className="p-3 text-right text-green-400">
                      {num(item.openingStock)}
                    </td>



                    <td className="p-3 text-right text-emerald-400">
                      {num(item.vendorInQty)}
                    </td>

                    <td className="p-3 text-right text-cyan-400">
                      {num(item.siteReturnQty)}
                    </td>

                    <td className="p-3 text-right text-red-400">
                      {num(item.storeOutQty)}
                    </td>

                    <td className="p-3 text-right font-semibold text-red-400">
                      {num(item.availableQty)}
                    </td>

                    <td className="p-3 text-right font-bold text-orange-400">
                      {num(item.shortageQty)}
                    </td>
                    <td className="p-3 text-right font-bold text-red-400">
                      ₹ {num(item.negativeStockValue)}
                    </td>

                    <td className="p-3 text-slate-300">
                      {item.lastDocumentNo || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

