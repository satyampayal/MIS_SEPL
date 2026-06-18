import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Plus,
  Users,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";
import AddBillModal from "./AddBillModal";
import BASE_URL from "../config/api";

const contactSections = [
  { key: "client", label: "Client Team" },
  { key: "project", label: "Project Incharge" },
  { key: "staff", label: "Staff" },
  { key: "electrical", label: "Electrical" },
  { key: "helper", label: "Helper" },
  { key: "hr", label: "HR Department" },
  { key: "accounts", label: "Accounts Department" },
  { key: "safety", label: "Safety Team" },
  { key: "store", label: "Store Team" },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [mode, setMode] = useState("add");
  const [pendingBills, setPendingBills] = useState(0);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  const token = localStorage.getItem("token");
  const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = loggedInUser?.role;

  const canManageProject = ["Super Admin", "Admin", "Manager"].includes(
    userRole
  );

  const fetchProject = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/get/${projectId}`);
      const data = await res.json();
      setProject(data.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const findPendingBills = (getBills = []) => {
    return getBills.filter((bill) => !bill?.billFile).length;
  };

  const fetchBills = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/project-master/get/bill/${projectId}`
      );
      const data = await res.json();
      setBills(data.data || []);
      setPendingBills(findPendingBills(data.data || []));
    } catch (err) {
      console.log(err);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      setFinancialLoading(true);

      const res = await fetch(
        `${BASE_URL}/project-master/financial-summary/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setFinancialSummary(data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setFinancialLoading(false);
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!canManageProject) {
      alert("You do not have permission");
      return;
    }

    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        const res = await fetch(
          `${BASE_URL}/project-master/delete/bill/${billId}/${projectId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        alert(data.message);

        fetchProject();
        fetchBills();
        fetchFinancialSummary();
      } catch (err) {
        console.log(err);
        alert("Error deleting bill");
      }
    }
  };

  useEffect(() => {
    fetchProject();
    fetchBills();
    fetchFinancialSummary();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        Project not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* PROJECT SUMMARY */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-slate-400 mt-1">Code: {project.code}</p>
            </div>

            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm">
              {project.status}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <Info label="Client" value={project.clientName} />
            <Info label="Location" value={project.location} />
            <Info label="Manager" value={project.manager} />
            <Info label="Phone" value={project.phone} />
            <Info label="Type of Work" value={project.typeOfWork} />
            <Info label="DLP Period" value={project.dlpPeriod} />

            {canManageProject && (
              <>
                <Info label="Order No" value={project.orderNumber} />
                <Info label="Order Date" value={project.orderDate} />
                <Info label="Order Amount" value={`₹ ${formatAmount(project.orderAmount)}`} />
                <Info label="Alloted Company" value={project.allotedCompany} />
                <Info label="Consignee Name" value={project.consigneeName} />
                <Info label="Place Of Delivery" value={project.placeOfDelivery} />
                <Info label="GST Number" value={project.gstNumber} />
              </>
            )}
          </div>

          {canManageProject && project.consigneeAddress && (
            <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <p className="text-slate-500 text-sm">Consignee Address</p>
              <p className="text-slate-200 mt-1">{project.consigneeAddress}</p>
            </div>
          )}

          <div className="mt-6">
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="text-cyan-400">{project.progress || 0}%</span>
            </div>

            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-cyan-400 h-3"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* PROJECT CONTACTS ONLY ADMIN / MANAGER */}
        {canManageProject && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <Users className="text-cyan-400" />
              Project Contacts
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              {contactSections.map((section) => {
                const contacts = project?.projectContacts?.[section.key] || [];

                return (
                  <div
                    key={section.key}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4"
                  >
                    <h3 className="text-cyan-400 font-semibold mb-3">
                      {section.label}{`(${contacts?.length})`}
                    </h3>

                    {contacts.length === 0 ? (
                      <p className="text-slate-500 text-sm">No contact added</p>
                    ) : (
                      <div className="space-y-3">
                        {contacts.map((person, index) => (
                          <div
                            key={index}
                            className="border border-slate-800 rounded-xl p-3"
                          >
                            <p className="font-semibold text-white">
                              {person.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {person.designation || "-"}
                            </p>

                            {person.email && (
                              <p className="text-sm text-slate-400 flex items-center gap-2 mt-2">
                                <Mail size={14} /> {person.email}
                              </p>
                            )}

                            {person.contactNumber && (
                              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                                <Phone size={14} /> {person.contactNumber}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PO FILE ONLY ADMIN / MANAGER */}
        {canManageProject && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-cyan-400" size={20} />
              PO File
            </h2>

            {project.poFile ? (
              <div className="flex gap-4">
                <a
                  href={project.poFile}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-xl"
                >
                  View PO
                </a>

                <a
                  href={project.poFile}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-500 text-slate-950 font-semibold px-4 py-2 rounded-xl"
                >
                  Download PO
                </a>
              </div>
            ) : (
              <p className="text-slate-500">No PO uploaded</p>
            )}
          </div>
        )}

        {/* FINANCIAL SUMMARY ONLY ADMIN / MANAGER */}
        {canManageProject && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShieldCheck className="text-cyan-400" />
                Project Financial Summary
              </h2>

              {financialLoading && (
                <span className="text-sm text-slate-500">Updating...</span>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-5">
              <SummaryCard title="Work Order Value" value={financialSummary?.workOrderValue} />
              <SummaryCard title="Bill Raised" value={financialSummary?.totalBillRaised} color="text-cyan-400" />
              <SummaryCard title="Amount Received" value={financialSummary?.totalReceived} color="text-emerald-400" />
              <SummaryCard title="Pending Payment" value={financialSummary?.pendingPayment} color="text-red-400" />
              <SummaryCard title="Project Expense" value={financialSummary?.totalExpense} color="text-orange-400" />
              <SummaryCard title="Approx Balance" value={financialSummary?.approxBalance} color="text-purple-400" />

              <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800">
                <p className="text-slate-500">Total Bills</p>
                <h2 className="text-2xl font-bold mt-2">
                  {financialSummary?.totalBills || 0}
                </h2>
              </div>

              <div className="bg-red-500/10 rounded-2xl p-5 border border-red-500/20">
                <p className="text-slate-400">Pending Bill Copies</p>
                <h2 className="text-2xl font-bold mt-2 text-red-400">
                  {pendingBills || 0}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* BILLING SECTION */}
        {canManageProject && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold">Bills / Invoices</h2>

              {pendingBills > 0 && (
                <span className="text-red-400 font-semibold">
                  Pending Bills copy: {pendingBills}
                </span>
              )}

              <button
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
                onClick={() => {
                  setSelectedBill(null);
                  setShowModal(true);
                  setMode("add");
                }}
              >
                <Plus size={17} />
                Add Bill
              </button>
            </div>

            {bills.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-center text-sm">
                  <thead className="bg-slate-950 text-slate-300">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Bill No</th>
                      <th className="p-3">Invoice No.</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Bill Group</th>
                      <th className="p-3">File</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.map((bill) => (
                      <tr
                        key={bill._id}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                      >
                        <td className="p-3">{bill.billType}</td>
                        <td className="p-3">{bill.billTypeCount}</td>
                        <td className="p-3">{bill.billNumber}</td>
                        <td className="p-3">₹ {formatAmount(bill.billAmount)}</td>
                        <td className="p-3">{bill.billDate}</td>
                        <td className="p-3">{bill.billDescription || "-"}</td>
                        <td className="p-3">{bill.billGroup || "-"}</td>
                        <td className="p-3">
                          {bill.billFile ? (
                            <a
                              href={bill.billFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 underline"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              className="bg-slate-700 text-white px-3 py-2 rounded-xl"
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowModal(true);
                                setMode("view");
                              }}
                            >
                              View
                            </button>

                            <button
                              className="bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl"
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowModal(true);
                                setMode("edit");
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteBill(bill._id)}
                              className="bg-red-500/20 text-red-400 px-3 py-2 rounded-xl"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No bills added yet</div>
            )}
          </div>
        )}
      </div>

      <AddBillModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        projectId={projectId}
        refreshBills={fetchBills}
        mode={mode}
        refreshProject={fetchProject}
        bill={selectedBill}
      />
    </div>
  );
}

function Info({ label, value }) {
  return (
    <p className="bg-slate-950/50 border border-slate-800 rounded-xl p-3">
      <span className="block text-slate-500 text-xs mb-1">{label}</span>
      <strong className="text-slate-100">{value || "-"}</strong>
    </p>
  );
}

function SummaryCard({ title, value, color = "text-slate-100" }) {
  return (
    <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition">
      <p className="text-slate-500">{title}</p>
      <h2 className={`text-2xl font-bold mt-2 ${color}`}>
        ₹ {formatAmount(value)}
      </h2>
    </div>
  );
}

function formatAmount(amount) {
  return Number(amount || 0).toLocaleString("en-IN");
}