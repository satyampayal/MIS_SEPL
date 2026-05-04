import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import AddBillModal from "./AddBillModal";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [mode, setMode] = useState("add"); // "add" | "edit" | "view" 

  // 🔹 Fetch project
  const fetchProject = async () => {
    try {
      const res = await fetch(`http://localhost:5000/project-master/get/${projectId}`);
      const data = await res.json();
      setProject(data.data);
      console.log(DataTransfer)
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchBills = async () => {
    try {
      const res = await fetch(`http://localhost:5000/project-master/get/bill/${projectId}`);
      const data = await res.json();
      console.log("Bills for project ", data);
      setBills(data.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  const handleDeleteBill = async (billId) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {

        const res = await fetch(`http://localhost:5000/project-master/delete/bill/${billId}/${projectId}`, {
          method: "DELETE"
        })
        const data = await res.json();
        alert(data.message);
        fetchProject();
        fetchBills();
      }
      catch (err) {
        console.log(err);
        alert("Error deleting bill");
      }
    }
  }
  const handleEditBill = (billId) => {

  }

  useEffect(() => {
    fetchProject();
    fetchBills();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  if (!project) return <div className="p-6">Project not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* 🔙 Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* 🧾 PROJECT SUMMARY */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-gray-500 mb-4">Code: {project.code}</p>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <p><strong>Client:</strong> {project.clientName}</p>
            <p><strong>Location:</strong> {project.location}</p>
            <p><strong>Manager:</strong> {project.manager}</p>
            <p><strong>Phone:</strong> {project.phone}</p>
            <p><strong>Order No:</strong> {project.orderNumber}</p>
            <p><strong>Order Date:</strong> {project.orderDate}</p>
            <p><strong>Order Amount:</strong> {project.orderAmount}</p>

            <p><strong>dlp Period:</strong> {project.dlpPeriod}</p>
            <p><strong>Type of Work:</strong> {project.typeOfWork}</p>



            <p><strong>Status:</strong> {project.status}</p>
            <p><strong>Alloted Company:</strong> {project?.allotedCompany}</p>


          </div>

          {/* 📊 Progress */}
          <div className="mt-6">
            <div className="flex justify-between mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>

            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-3"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📂 PO FILE SECTION */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} />
            PO File
          </h2>

          {project.poFile ? (
            <div className="flex gap-4">
              <a
                href={project.poFile}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-xl"
              >
                View PO
              </a>

              <a
                href={project.poFile}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 text-white px-4 py-2 rounded-xl"
              >
                Download PO
              </a>
            </div>
          ) : (
            <p className="text-gray-500">No PO uploaded</p>
          )}

          {/* Later: Add Upload Modal Button */}
        </div>

        {/* 💰 BILLING SECTION */}
        <div className="bg-white rounded-3xl shadow-sm p-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bills / Invoices</h2>

            <button onClick={() => {
              setSelectedBill(null);
              setShowModal(true);
              setMode("add");
            }}>
              Add Bill
            </button>
          </div>
          {/* // Bills Table */}
          {/* TABLE */}
          {bills.length > 0 ?

            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Type Count</th>
                    <th className="p-3">Bill No</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">File</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody> {bills.map((bill) =>
                (<tr key={bill._id} className="border-b hover:bg-gray-50 ">
                  <td className="p-3 ">{bill.billType}</td>
                  <td className="p-3">{bill.billTypeCount}</td>
                  <td className="p-3">{bill.billNumber}</td>
                  <td className="p-3">₹ {bill.billAmount}</td>
                  <td className="p-3">{bill.billDate}</td>
                  <td className="p-3">
                    {
                      bill.billFile
                        ?
                        (<a href={bill.billFile} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 underline" > View </a>)
                        :
                        ("-")
                    }
                  </td>
                  <td className="p-3">
                    <button onClick={() => {
                      setSelectedBill(bill);
                      setShowModal(true);
                      setMode("view");
                    }}>
                      View
                    </button>
                    <button onClick={() => {
                      setSelectedBill(bill);
                      setShowModal(true);
                      setMode("edit");
                    }}>
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeleteBill(bill._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl"
                    >
                      Delete
                    </button>
                  </td>
                </tr>))}
                </tbody>

              </table>
            </div>
            :
            <div className="text-gray-500 text-sm">
              No bills added yet
            </div>
          }



        </div>

      </div>
      {/* MODAL */}
      <AddBillModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        projectId={projectId}
        refreshBills={fetchBills}
        mode={mode}
        refreshProject={fetchProject}
        

      />
    </div>
  );
}