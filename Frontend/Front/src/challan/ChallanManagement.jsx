import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, FileText, Plus } from "lucide-react";

const ChallanManagement = () => {
  const [challans, setChallans] = useState([]);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All Sites");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([
    {
      description: "",
      qty: 0,
      unit: 'pcs',
      rate: 0,
      amount: 0
    }
  ])
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        qty: 1,
        unit: "Pcs",
        rate: 0,
        amount: 0
      }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];

    updatedItems[index][field] = value;

    if (field === "qty" || field === "rate") {
      updatedItems[index].amount =
        updatedItems[index].qty * updatedItems[index].rate;
    }

    setItems(updatedItems);
  };

  const handleDeleteItem = (index) => {
  const updatedItems = items.filter((_, i) => i !== index);
  setItems(updatedItems);
};

  const fetchChallans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/challan/all");
      setChallans(res.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, []);



  const filteredChallans = challans.filter((item) => {
    const matchSearch =
      item.challanNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      item.site?.toLowerCase().includes(search.toLowerCase());

    const matchSite =
      siteFilter === "All Sites" || item.site === siteFilter;

    const matchStatus =
      statusFilter === "All Status" ||
      item.deliveryStatus === statusFilter;

    return matchSearch && matchSite && matchStatus;
  });

  const uniqueSites = [
    "All Sites",
    ...new Set(challans.map((item) => item.site).filter(Boolean)),
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-yellow-100 text-yellow-700";
      case "In Transit":
        return "bg-blue-100 text-blue-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const [showModal, setShowModal] = useState(false);

  const handleCreateChallan = () => {
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
  };

  const saveChallan=async ()=>{
    console.log(items);
    
  }

  return (
    <>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Challan Management
            </h1>

            <button
              onClick={handleCreateChallan}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition"
            >
              <Plus size={18} />
              Create Challan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search challans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
            />

            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3"
            >
              {uniqueSites.map((site, index) => (
                <option key={index} value={site}>
                  {site}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-4">CHALLAN NO.</th>
                  <th>SITE</th>
                  <th>VENDOR</th>
                  <th>DATE</th>
                  <th>ITEMS</th>
                  <th>STATUS</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      Loading challans...
                    </td>
                  </tr>
                ) : filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No challans found
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-5 font-medium text-gray-800">
                        {item.challanNumber}
                      </td>

                      <td>{item.site}</td>
                      <td>{item.vendorName}</td>

                      <td>
                        {new Date(item.dispatchDate).toLocaleDateString()}
                      </td>

                      <td>{item.quantity}</td>

                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(
                            item.deliveryStatus
                          )}`}
                        >
                          {item.deliveryStatus}
                        </span>
                      </td>

                      <td>
                        <div className="flex items-center justify-center gap-4">
                          <button className="text-gray-500 hover:text-black">
                            <Eye size={18} />
                          </button>

                          <button className="text-blue-500 hover:text-blue-700">
                            <Pencil size={18} />
                          </button>

                          <button className="text-green-500 hover:text-green-700">
                            <FileText size={18} />
                          </button>
                        </div>
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


      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 ">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-2xl font-bold">Create New Challan</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">Challan Type *</label>
                <select className="w-full border rounded-xl px-4 py-3">
                  <option>DC - Delivery Challan</option>
                  <option>Material Return</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Challan Number *</label>
                <input
                  type="text"
                  value="Auto Generated"
                  readOnly
                  className="w-full border rounded-xl px-4 py-3 bg-gray-50"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Site *</label>
                <select className="w-full border rounded-xl px-4 py-3">
                  <option>Select Site</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Vendor *</label>
                <select className="w-full border rounded-xl px-4 py-3">
                  <option>Select Vendor</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Status *</label>
                <select className="w-full border rounded-xl px-4 py-3">
                  <option>Pending</option>
                  <option>In Transit</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Notes</label>
                <input
                  type="text"
                  placeholder="Additional notes"
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div className="px-6">
              <h3 className="text-lg font-semibold mb-4">Items *</h3>

              <div className="border rounded-2xl overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3">Item Name</th>
                      <th className="text-left px-4 py-3">Qty</th>
                      <th className="text-left px-4 py-3">Unit</th>
                      <th className="text-left px-4 py-3">Rate</th>
                      <th className="text-left px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Action</th>
                    </tr>
                  </thead>

                    <tbody>
                      {items.map((item, index) =>


                        <tr key={index}>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              placeholder="Item description"
                              className="w-full border rounded-lg px-3 py-2"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(index, "description", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              // defaultValue={1}
                              className="w-24 border rounded-lg px-3 py-2"
                              value={item.qty}
                              onChange={(e) =>
                                handleItemChange(index, "qty", Number(e.target.value))
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="text"
                              defaultValue="Pcs"
                              className="w-24 border rounded-lg px-3 py-2"
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              // defaultValue={0}
                              className="w-28 border rounded-lg px-3 py-2"
                              value={item.rate}
                              onChange={(e) =>
                                handleItemChange(index, "rate", Number(e.target.value))
                              }
                            />
                          </td>

                          <td className="px-4 py-4 font-medium"> ₹{item.amount}</td>

                          <td className="px-4 py-4">
                            <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteItem(index)}>
                              Delete
                            </button>
                          </td>
                        </tr>

                      )}
                    </tbody>



                </table>
              </div>

              <div className="flex justify-between items-center mb-6">
                <button className="text-blue-600 font-medium"  onClick={()=>handleAddItem()} >
                  + Add Item
                </button>

                <p className="font-semibold text-lg">
                  Total Amount: ₹0
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-3 rounded-xl border"
              >
                Cancel
              </button>
              <button className="px-5 py-3 rounded-xl bg-blue-600 text-white" onClick={()=>saveChallan()} >
                Save Challan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChallanManagement;
