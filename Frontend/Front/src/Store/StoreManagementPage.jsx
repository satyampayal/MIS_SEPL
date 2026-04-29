import React from "react";
import { Plus, Pencil, Package } from "lucide-react";
import axios from "axios";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const stores = [
  {
    id: 1,
    storeName: "Head Office Store",
    storeCode: "HO-STORE",
    storeIncharge: "Deepak Singh",
    phone: "+91 98765 99999",
    location: "Delhi Head Office",
    inventoryCount: 25,
  },
  {
    id: 2,
    storeName: "Site Store - Metro Project",
    storeCode: "SITE-STORE-01",
    storeIncharge: "Rahul Verma",
    phone: "+91 98111 22222",
    location: "Metro Line 3 Extension",
    inventoryCount: 14,
  },
];



const StoreManagementPage = () => {
  const [showModal, setShowModal] = React.useState(false);
  const navigate = useNavigate();

  const handleAddStore = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleAddItem = (storeId) => {
    console.log("Add item for store:", storeId);
  };

  const handleEditStore = (storeId) => {
    console.log("Edit store:", storeId);
  };

  const addStore = async () => {
    console.log(store)
    // Make API call to add store
    try {
      const response = await axios.post('http://localhost:5000/store-master/create', store);
      console.log("Store added successfully:", response.data);
      fetchmasterStores(); // Refresh the list of stores after adding a new one
      closeModal(); // Close the modal after adding the store


    } catch (error) {
      console.error("Error adding store:", error);
    }

  }
  const [store, setStore] = useState(
  {
    storeName: "",
    storeType: "",
    location: "",
    storeIncharge: "",
    contactNumber: "",
    storeCode: "",
    associtedSite: ""
  },
)
// Get All Stores 
const [masterStores,setMasterStores]=useState([]);
const [getAllStoreItems,setGetAllStoreItems]=useState([]);
  const fetchmasterStores=async()=>{
    try{
      const response=await axios.get('http://localhost:5000/store-master/all');
      const allItemsResponse=await axios.get('http://localhost:5000/store/getAllItems');

      setMasterStores(response.data.data);
      setGetAllStoreItems(allItemsResponse.data.data);
      console.log("Master Stores:",response.data.data);
      
    }
    catch(error){
    console.log("error fetching master stores:",error);
  }
  } 

useEffect(()=>{
   fetchmasterStores();
},[])

const handleStoreChange = (e) => {
  e.preventDefault();
  setStore({ ...store, [e.target.name]: e.target.value })

}

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Store Management
              </h1>
              <p className="text-gray-500 mt-2">
                Manage stores and track inventory by location
              </p>
            </div>

            <button
              onClick={handleAddStore}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium shadow-sm transition"
            >
              <Plus size={18} />
              Add Store
            </button>
          </div>

          <div className="space-y-6">
            {masterStores?.map((store) => (
              <div
                key={store._id}
                className="bg-white border border-purple-100 rounded-3xl shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center text-white">
                        <Package size={28} />
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                          {store.storeName}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {store.location}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEditStore(store._id)}
                      className="text-purple-500 hover:text-purple-700"
                    >
                      <Pencil size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <p className="text-sm text-gray-500">Store Code</p>
                      <p className="font-medium text-gray-800 mt-1">
                        {store.storeCode}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Store Incharge</p>
                      <p className="font-medium text-gray-800 mt-1">
                        {store.storeIncharge}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800 mt-1">
                        {store.contactNumber}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t px-6 py-5 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2 text-gray-700 font-medium" onClick={()=>navigate(`/store/${store._id}`)}>
                    <Package size={18} />
                    Inventory ({store.inventoryCount} items) {getAllStoreItems?.length}
                  </div>

                  <button
                    onClick={() => handleAddItem(store.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      );

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Add New Store</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">Store Type *</label>
                <select className="w-full border rounded-xl px-4 py-3"
                  name="storeType"
                  value={store.storeType}
                  onChange={handleStoreChange}
                >
                  <option>Site Store</option>
                  <option>Head Office Store</option>
                  <option>Project Store</option>
                </select>
              </div>



              <div>
                <label className="block mb-2 font-medium">Store Name *</label>
                <input
                  type="text"
                  name="storeName"
                  value={store.storeName}
                  onChange={handleStoreChange}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="e.g., Main Store"
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Store Code *</label>
                <input
                  type="text"
                  name="storeCode"
                  value={store.storeCode}
                  onChange={handleStoreChange}
                  placeholder="e.g., STORE-001"
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Store Incharge *</label>
                <input
                  type="text"
                  className="w-full border rounded-xl px-4 py-3"
                  name="storeIncharge"
                  value={store.storeIncharge}
                  onChange={handleStoreChange}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Location  *</label>
                <input
                  type="text"
                  className="w-full border rounded-xl px-4 py-3"
                  name="location"
                  value={store.location}
                  onChange={handleStoreChange}
                  placeholder="e.g., New York"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Phone *</label>
                <input
                  type="text"
                  className="w-full border rounded-xl px-4 py-3"
                  name="contactNumber"
                  value={store.contactNumber}
                  onChange={handleStoreChange}
                  placeholder="e.g., 123-456-7890"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-3 rounded-xl border"
              >
                Cancel
              </button>

              <button className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium"
                onClick={() => addStore()}
              >
                Add Store
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreManagementPage;
