import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { vendorList, projectSiteList } from "./Constant";
export default function TaxInvoiceRegisterPage() {
  const [formData, setFormData] = useState({
    itemDetailsRequired: "no",
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

  const isDifference =
    formData.quantitySent &&
    formData.quantityReceived &&
    Number(formData.quantitySent) !== Number(formData.quantityReceived);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      // const [year, month, day] = formData.invoiceDate.split("-");
      // const formattedDate = `${day}-${month}-${year}`;
      
      const payload = {
        ...formData
      };
      const response = await fetch("http://localhost:5000/tax-invoice-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Data saved successfully 🚀");
        console.log("Saved Successfully");
      } else {
        alert(result.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      alert("Server connection failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Tax Invoice Register</h1>
        <p className="text-gray-500 mb-8">
          Manage invoice, challan and delivery verification
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Invoice Date</label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  placeholder="Enter invoice number"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Invoice Amount</label>
                <input
                  type="number"
                  name="invoiceAmount"
                  value={formData.invoiceAmount}
                  onChange={handleChange}
                  placeholder="Enter invoice amount"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Vendor Name</label>
                <select
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Select Vendor</option>
                  {vendorList.map((vendor, index) => (
                    <option key={index} value={vendor}>
                      {vendor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">
                  Purpose / Project Site
                </label>
                <select
                  name="projectSite"
                  value={formData.projectSite}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Select Project Site</option>
                  {projectSiteList.map((site, index) => (
                    <option key={index} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Challan Verification</h2>

            <label className="block mb-3 font-medium">
              Challan Created?
            </label>

            <div className="flex gap-6 mb-6">
              <label>
                <input
                  type="radio"
                  name="challanCreated"
                  value="yes"
                  checked={formData.challanCreated === "yes"}
                  onChange={handleChange}
                  className="mr-2"
                />
                Yes
              </label>

              <label>
                <input
                  type="radio"
                  name="challanCreated"
                  value="no"
                  checked={formData.challanCreated === "no"}
                  onChange={handleChange}
                  className="mr-2"
                />
                No
              </label>
            </div>

            {formData.challanCreated === "yes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Challan Number</label>
                  <input
                    type="text"
                    name="challanNumber"
                    value={formData.challanNumber}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Challan Date</label>
                  <input
                    type="date"
                    name="challanDate"
                    value={formData.challanDate}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Delivery Status</label>
                  <select
                    name="deliveryStatus"
                    value={formData.deliveryStatus}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="">Select Status</option>
                    <option value="delivered">Delivered</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial Delivery</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {formData.deliveryStatus === "delivered" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Material Verification</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Quantity Sent</label>
                  <input
                    type="number"
                    name="quantitySent"
                    value={formData.quantitySent}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Quantity Received</label>
                  <input
                    type="number"
                    name="quantityReceived"
                    value={formData.quantityReceived}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                {isDifference ? (
                  <p className="text-red-600 font-semibold">
                    Warning: Quantity mismatch detected. Please verify material difference.
                  </p>
                ) : (
                  formData.quantitySent &&
                  formData.quantityReceived && (
                    <p className="text-green-600 font-semibold">
                      No difference found. Material delivered successfully.
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Invoice Material Details</h2>

            <label className="block mb-3 font-medium">
              Do you want to enter item details of tax invoice material?
            </label>

            <div className="flex gap-6 mb-6">
              <label>
                <input
                  type="radio"
                  name="itemDetailsRequired"
                  value="yes"
                  checked={formData.itemDetailsRequired === "yes"}
                  onChange={handleChange}
                  className="mr-2"
                />
                Yes
              </label>

              <label>
                <input
                  type="radio"
                  name="itemDetailsRequired"
                  value="no"
                  checked={formData.itemDetailsRequired === "no"}
                  onChange={handleChange}
                  className="mr-2"
                />
                No
              </label>
            </div>

            {formData.itemDetailsRequired === "yes" && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Material Item Entry
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 font-medium">Item Description</label>
                    <input
                      type="text"
                      placeholder="Enter item description"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">HSN Code</label>
                    <input
                      type="text"
                      placeholder="Enter HSN code"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Quantity</label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Rate</label>
                    <input
                      type="number"
                      placeholder="Enter rate"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Per</label>
                    <input
                      type="text"
                      placeholder="Nos / Kg / Mtr"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Discount</label>
                    <input
                      type="number"
                      placeholder="Enter discount"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2 font-medium">Taxable Value</label>
                    <input
                      type="number"
                      placeholder="Enter taxable value"
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 rounded-xl font-medium"
            >
              Submit Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
