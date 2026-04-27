import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Receipt } from "lucide-react";

export default function EditTaxInvoicePage() {
  const navigate = useNavigate();
  const { taxInvoiceId } = useParams();

  const [formData, setFormData] = useState({
    invoiceDate: "",
    invoiceNumber: "",
    invoiceAmount: "",
    vendorName: "",
    projectSite: "",
    challanCreated: "no",
    challanNumber: "",
    challanDate: "",
    deliveryStatus: "",
    quantitySent: "",
    quantityReceived: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchSingleInvoice = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/tax-invoice-register/${taxInvoiceId}`
        );

        const result = await response.json();

        if (result.data) {
          setFormData(result.data);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchSingleInvoice();
  }, [taxInvoiceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/update-tax-invoice/${taxInvoiceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();
      alert(result.message);
      navigate("/tax-invoice-list");
    } catch (error) {
      console.log(error);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/tax-invoice-list")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white hover:shadow-md transition"
          >
            <ArrowLeft size={18} />
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Receipt size={30} />
            <div>
              <h1 className="text-3xl font-bold">Edit Tax Invoice Register</h1>
              <p className="text-gray-500 text-sm">
                Update existing invoice details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block mb-2 font-medium">Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Invoice Amount</label>
                <input
                  type="number"
                  name="invoiceAmount"
                  value={formData.invoiceAmount || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Vendor Name</label>
                <select
                  name="vendorName"
                  value={formData.vendorName || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                >
                  <option value="">Select Vendor</option>
                  <option value="ABC Traders">ABC Traders</option>
                  <option value="Sharma Electricals">Sharma Electricals</option>
                  <option value="Metro Suppliers">Metro Suppliers</option>
                  <option value="Power Tech Pvt Ltd">Power Tech Pvt Ltd</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">Project Site</label>
                <select
                  name="projectSite"
                  value={formData.projectSite || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                >
                  <option value="">Select Project Site</option>
                  <option value="Delhi Site A">Delhi Site A</option>
                  <option value="Noida Project">Noida Project</option>
                  <option value="Gurgaon Tower">Gurgaon Tower</option>
                  <option value="Factory Unit 2">Factory Unit 2</option>
                </select>
              </div>

              <div style={{ display: "none" }}>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>

              <div style={{ display: "none" }}>
                <input
                  type="text"
                  name="projectSite"
                  value={formData.projectSite || ""}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-xl font-medium"
              >
                Update Invoice
              </button>

              <button
                type="button"
                onClick={() => navigate("/tax-invoice-list")}
                className="border px-8 py-3 rounded-xl font-medium bg-white"
              >
                Back to List
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
