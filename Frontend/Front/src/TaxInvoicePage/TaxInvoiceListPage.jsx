import React, { useEffect, useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TaxInvoiceListPage() {
  const navigate=useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const response = await fetch("http://localhost:5000/total-tax-invoice-register");
      const result = await response.json();
    //   console.log(result)
      setInvoices(result.taxInvoiceList || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this Tax Invoice?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/delete-tax-invoice/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      alert(result.message);
      fetchInvoices();
    } catch (error) {
      console.log(error);
      alert("Delete failed");
    }
  };

  const handleEdit = (id) => {
  //  console.log(id)
       navigate(`/edit-tax-invoice/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <Receipt size={30} />
            <h1 className="text-3xl font-bold">Tax Invoice Register List</h1>
          </div>
          <p className="text-gray-500">
            View, edit and manage all tax invoice records
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-8 text-center text-lg font-medium">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-lg font-medium">
              No tax invoice records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Invoice No.</th>
                    <th className="p-4 text-left">Invoice Date</th>
                    <th className="p-4 text-left">Vendor</th>
                    <th className="p-4 text-left">Amount</th>
                    <th className="p-4 text-left">Project Site</th>
                    <th className="p-4 text-left">Delivery Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-4 font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-4">{invoice.invoiceDate}</td>
                      <td className="p-4">{invoice.vendorName}</td>
                      <td className="p-4">₹ {invoice.invoiceAmount}</td>
                      <td className="p-4">{invoice.projectSite}</td>
                      <td className="p-4">{invoice.deliveryStatus || "-"}</td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEdit(invoice._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:shadow-md transition"
                          >
                            <Pencil size={18} />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(invoice._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:shadow-md transition"
                          >
                            <Trash2 size={18} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
