import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertTriangle, Package, Pencil, Trash2, } from "lucide-react";
import axios from "axios";
import AddStoreItemModal from "./AddStoreItemModal";
import BASE_URL from "../../config/api";

const StoreInventoryPage = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showItemModal, setShowItemModal] = useState(false);
    const itemsPerPage = 10;

    const fetchStoreItems = async () => {
        try {
            setLoading(true);

            // Replace with your actual API
            const response = await axios.get(
                `${BASE_URL}/api/store-items/all`
                , {
                    params: {
                        searchTerm: searchTerm
                    }
                }
            );


            setItems(response?.data?.data || []);
        } catch (error) {
            console.log("Error fetching inventory items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStoreItems();
    }, [storeId, searchTerm]);

    const outOfStockItems = useMemo(
        () => items.filter((item) => Number(item.currentStock) <= 0),
        [items]
    );

    const lowStockItems = useMemo(
        () =>
            items.filter(
                (item) =>
                    Number(item.currentStock) > 0 &&
                    Number(item.currentStock) <= Number(item.minimumStock)
            ),
        [items]
    );

    const totalPages = Math.ceil(items.length / itemsPerPage) || 1;

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [items, currentPage]);

    const getStatus = (qty, min) => {
        if (qty <= 0) return "Out of Stock";
        if (qty <= min) return "Low Stock";
        return "Normal";
    };

    const handleEdit = (itemId) => {
        // Implement edit functionality
        console.log("Edit item with ID:", itemId);
    }
    const handleDelete = async (itemId) => {
        try {
            if (!itemId) {
                alert("Invalid item ID");
                return;
            }
            const confirmDelete = window.confirm("Are you sure to delete this item?");
            if (!confirmDelete) {
                return;
            }
            const response = await axios.delete(`${BASE_URL}/api/store-items/deleteItem/${itemId}`);
            if (response?.status === 200) {
                fetchStoreItems(); // Refresh the item list
            }
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
                        >
                            <ArrowLeft size={18} /> Back to Stores
                        </button>

                        <h1 className="text-3xl font-bold text-gray-800">
                            Store Inventory
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Manage inventory, stock alerts, and item status
                        </p>
                    </div>

                    <button 
                      onClick={() => setShowItemModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium shadow-sm transition">
                        <Plus size={18} />
                        Add Item
                    </button>
                </div>

                {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
                    <div className="space-y-4 mb-6">
                        {outOfStockItems.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                                <AlertTriangle className="mt-1" size={20} />
                                <div>
                                    <p className="font-semibold">Out of Stock Alert</p>
                                    <p>{outOfStockItems.length} item(s) are out of stock.</p>
                                </div>
                            </div>
                        )}

                        {lowStockItems.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                                <AlertTriangle className="mt-1" size={20} />
                                <div>
                                    <p className="font-semibold">Low Stock Alert</p>
                                    <p>{lowStockItems.length} item(s) are running near minimum stock.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                    <div className="p-5 border-b flex items-center gap-2 font-semibold">
                        <Package size={18} />
                        Total Items ({items.length})
                    </div>

                    <div className="p-5 border-b flex items-center gap-4">
                        <div>
                            <label for="search">Search Items: </label>
                            <input
                                name="search"
                                placeholder="Enter item name"
                                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                    </div>


                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-5 py-4">Item Name</th>
                                    <th className="text-left px-5 py-4">Category</th>
                                    <th className="text-left px-5 py-4">Current Stock</th>
                                    <th className="text-left px-5 py-4">Minimum Stock</th>
                                    <th className="text-left px-5 py-4">Rate</th>
                                    <th className="text-left px-5 py-4">Status</th>
                                    <th className="text-left px-5 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10">
                                            Loading inventory...
                                        </td>
                                    </tr>
                                ) : paginatedItems?.length > 0 ? (
                                    paginatedItems?.map((item, index) => {
                                        const qty = Number(item.currentStock || 0);
                                        const min = Number(item.minimumStock || 0);
                                        const status = getStatus(qty, min);

                                        return (
                                            <tr key={item._id || index} className={`border-t hover:bg-blue-100 transition   `}>
                                                <td className="px-5 py-4">{item.itemName}</td>
                                                <td className="px-5 py-4">{item.category}</td>
                                                <td className="px-5 py-4">{qty}</td>
                                                <td className="px-5 py-4">{min}</td>
                                                <td className="px-5 py-4">₹{item.rate || 0}</td>
                                                <td className="px-2 py-2">
                                                    <span
                                                        className={`px-3 py-1 text-sm font-medium rounded-full
                                                                      ${status === "Low Stock" ? "bg-orange-100 text-orange-700" : ""}
                                                                      ${status === "Out of Stock" ? "bg-red-100 text-red-700" : ""}
                                                                      ${status === "Normal" ? "bg-green-100 text-green-700" : ""}
                                                            `}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>
                                                <div className="flex items-center justify-center gap-3 ">
                                                    <button
                                                        // onClick={() => handleEdit(invoice._id)}
                                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition"
                                                    >
                                                        <Pencil size={18} />
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:shadow-md transition"
                                                    >
                                                        <Trash2 size={18} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10">
                                            No inventory items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 border-t flex items-center justify-between">


                        <p>
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className='flex gap-2'>

                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className="px-4 py-2 border rounded-xl disabled:opacity-50"
                            >
                                Previous
                            </button>

                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className="px-4 py-2 border rounded-xl disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>

                    </div>
                </div>
            </div>
            <AddStoreItemModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                refreshItems={fetchStoreItems}
                defaultStoreId={storeId}
            />
        </div>
    );
};

export default StoreInventoryPage;
