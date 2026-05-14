import React, { useMemo, useState } from "react";
import { ArrowLeft, Plus, IndianRupee, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const dummyBills = [
  {
    id: 1,
    billType: "RA-01",
    billCopy: "ra01-bill.pdf",
    month: "April 2026",
    billAmount: 200000,
    clearedDate: "12 Apr 2026",
    status: "Cleared",
  },
  {
    id: 2,
    billType: "RA-02",
    billCopy: "ra02-bill.pdf",
    month: "May 2026",
    billAmount: 150000,
    clearedDate: "18 May 2026",
    status: "Cleared",
  },
  {
    id: 3,
    billType: "Final Bill",
    billCopy: "final-bill.pdf",
    month: "June 2026",
    billAmount: 100000,
    clearedDate: "Pending",
    status: "Pending",
  },
];

const ProjectBillingProgressPage = () => {
  const navigate=useNavigate();
  const [project] = useState({
    projectName: "Metro Line Extension Project",
    siteName: "Site A - Delhi",
    clientName: "ABC Infrastructure Pvt Ltd",
    workOrderValue: 1000000,
  });

  const [bills] = useState(dummyBills);

  const clearedAmount = useMemo(() => {
    return bills
      .filter((bill) => bill.status === "Cleared")
      .reduce((acc, curr) => acc + Number(curr.billAmount || 0), 0);
  }, [bills]);

  const progressPercentage = useMemo(() => {
    if (!project.workOrderValue) return 0;
    return Math.min(
      ((clearedAmount / project.workOrderValue) * 100).toFixed(2),
      100
    );
  }, [clearedAmount, project.workOrderValue]);

  const pendingAmount = project.workOrderValue - clearedAmount;
const [showBillModal, setShowBillModal] = useState(false);

const [billData, setBillData] = useState({
  billType: "",
  billAmount: "",
  billDate: "",
  remarks: "",
});
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
             onClick={()=> navigate(-1)}
            >
              <ArrowLeft size={18} /> Back to Projects
            </button>

            <h1 className="text-3xl font-bold text-gray-800">
              Project Billing Progress
            </h1>
            <p className="text-gray-500 mt-2">
              Track bill clearance and project progress based on work order value
            </p>
          </div>

          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
           px-6 py-3 rounded-2xl font-medium shadow-sm transition"
           onClick={() => setShowBillModal(true)}
           >
            <Plus size={18} /> Upload Bill
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Work Order Value</p>
            <h2 className="text-2xl font-bold mt-2">₹{project.workOrderValue.toLocaleString()}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Cleared Amount</p>
            <h2 className="text-2xl font-bold mt-2">₹{clearedAmount.toLocaleString()}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Pending Amount</p>
            <h2 className="text-2xl font-bold mt-2">₹{pendingAmount.toLocaleString()}</h2>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <p className="text-sm text-gray-500">Project Progress</p>
            <h2 className="text-2xl font-bold mt-2">{progressPercentage}%</h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp size={20} /> Progress Bar
            </h2>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
            <div
              className="h-5 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Progress increases whenever the client clears the monthly bill.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2 font-semibold">
            <FileText size={18} /> Monthly Bill History
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-4">Month</th>
                  <th className="text-left px-5 py-4">Bill Amount</th>
                  <th className="text-left px-5 py-4">Cleared Date</th>
                  <th className="text-left px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t">
                    <td className="px-5 py-4">{bill.month}</td>
                    <td className="px-5 py-4">₹{bill.billAmount.toLocaleString()}</td>
                    <td className="px-5 py-4">{bill.clearedDate}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bill.status === "Cleared"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {showBillModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-2xl rounded-2xl p-6">

      <h2 className="text-xl font-bold mb-4">Upload Bill</h2>

      <select
        className="w-full border p-2 mb-3"
        onChange={(e) =>
          setBillData({ ...billData, billType: e.target.value })
        }
      >
        <option value="">Select Bill Type</option>
        <option>RA-01</option>
        <option>RA-02</option>
        <option>RA-03</option>
        <option>FINAL</option>
        <option>CREDIT</option>
      </select>

      <input
        type="number"
        placeholder="Bill Amount"
        className="w-full border p-2 mb-3"
        onChange={(e) =>
          setBillData({ ...billData, billAmount: e.target.value })
        }
      />

      <input
        type="date"
        className="w-full border p-2 mb-3"
        onChange={(e) =>
          setBillData({ ...billData, billDate: e.target.value })
        }
      />

      <input
        type="file"
        className="w-full border p-2 mb-3"
        onChange={(e) =>
          setBillData({ ...billData, billFile: e.target.files[0] })
        }
      />

      <textarea
        placeholder="Remarks"
        className="w-full border p-2 mb-3"
        onChange={(e) =>
          setBillData({ ...billData, remarks: e.target.value })
        }
      />

      <div className="flex justify-end gap-2">
        <button onClick={() => setShowBillModal(false)}>
          Cancel
        </button>

        <button
          className="bg-blue-600 text-white px-4 py-2"
          onClick={async () => {
            const formData = new FormData();

            Object.keys(billData).forEach((key) => {
              formData.append(key, billData[key]);
            });

            await axios.post(
              "http://localhost:5000/project-bill/create",
              formData
            );

            setShowBillModal(false);
          }}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ProjectBillingProgressPage;
