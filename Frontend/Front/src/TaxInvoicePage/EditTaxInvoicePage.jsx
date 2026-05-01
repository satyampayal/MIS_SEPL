import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Receipt } from "lucide-react";
import { vendorList, projectSiteList } from "../Constant";
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

  
  const isDifference =
    formData.quantitySent &&
    formData.quantityReceived &&
    Number(formData.quantitySent) !== Number(formData.quantityReceived);

  useEffect(() => {
    const fetchSingleInvoice = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/tax-invoice/get/${taxInvoiceId}`
        );

        const result = await response.json();

        if (result.data) {
          // convert  Indian date  to calender date 
        //   const [day,month,year] =result.data.invoiceDate.split("-");
        // const formattedDate = `${year}-${month}-${day}`;
          setFormData({...result.data});
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
      navigate("/TaxInvoiceListPage");
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
            onClick={() => navigate("/TaxInvoiceListPage")}
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
                  // type="date"
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
                  {vendorList.map((vendor, index) => (
                    <option key={index} value={vendor}>
                      {vendor}
                    </option>
                  ))}
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
                  {projectSiteList.map((site, index) => (
                    <option key={index} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
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
                onClick={() => navigate("/TaxInvoiceListPage")}
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
