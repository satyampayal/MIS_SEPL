import React, { useEffect, useState } from "react";
import {
  MapPin,
  Building2,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  X,
  UserPlus,
  Users,
  Eye,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../config/api";
import * as XLSX from "xlsx";

const emptyContact = {
  name: "",
  designation: "",
  email: "",
  contactNumber: "",
};

const emptyProjectContacts = {
  client: [],
  project: [],
  electrical: [],
  hr: [],
  accounts: [],
  safety: [],
  store: [],
};

const contactSections = [
  { key: "client", label: "Client Team" },
  { key: "project", label: "Project Incharge" },
  { key: "electrical", label: "Electrical Site Incharge" },
  { key: "hr", label: "HR Department" },
  { key: "accounts", label: "Accounts Department" },
  { key: "safety", label: "Safety Team" },
  { key: "store", label: "Store Team" },
];

export default function ProjectMasterManagementWithProgress() {
  const navigate = useNavigate();

  const [projects, setprojects] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [inProgress, setInprogess] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    location: "",
    clientName: "",
    orderNumber: "",
    orderDate: "",
    orderAmount: "",
    allotedCompany: "",
    typeOfWork: "SITC",
    dlpPeriod: "1 Year",
    complitionDate: "",
    manager: "",
    phone: "",
    status: "Active",
    progress: 0,
    poFile: null,
    consigneeName: "",
    consigneeAddress: "",
    placeOfDelivery: "",
    gstNumber: "",
    projectContacts: emptyProjectContacts,
  });

  const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = loggedInUser?.role;

  const canManageProject = ["Super Admin", "Admin", "Manager"].includes(userRole);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${BASE_URL}/project-master/all`);
      const result = await response.json();
      setprojects(result?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      location: "",
      clientName: "",
      orderNumber: "",
      orderDate: "",
      orderAmount: "",
      allotedCompany: "",
      typeOfWork: "SITC",
      dlpPeriod: "1 Year",
      complitionDate: "",
      manager: "",
      phone: "",
      status: "Active",
      progress: 0,
      poFile: null,
      consigneeName: "",
      consigneeAddress: "",
      placeOfDelivery: "",
      gstNumber: "",
      projectContacts: emptyProjectContacts,
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const addContactRow = (sectionKey) => {
    setFormData((prev) => ({
      ...prev,
      projectContacts: {
        ...prev.projectContacts,
        [sectionKey]: [
          ...(prev.projectContacts?.[sectionKey] || []),
          { ...emptyContact },
        ],
      },
    }));
  };

  const removeContactRow = (sectionKey, index) => {
    setFormData((prev) => ({
      ...prev,
      projectContacts: {
        ...prev.projectContacts,
        [sectionKey]: prev.projectContacts[sectionKey].filter(
          (_, i) => i !== index
        ),
      },
    }));
  };

  const handleContactChange = (sectionKey, index, field, value) => {
    setFormData((prev) => {
      const updatedContacts = [...prev.projectContacts[sectionKey]];

      updatedContacts[index] = {
        ...updatedContacts[index],
        [field]: value,
      };

      return {
        ...prev,
        projectContacts: {
          ...prev.projectContacts,
          [sectionKey]: updatedContacts,
        },
      };
    });
  };

  const handleAddProject = async () => {
    try {
      setInprogess(1);

      const formPayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "poFile") {
          if (formData.poFile) {
            formPayload.append("poFile", formData.poFile);
          }
        } else if (key === "projectContacts") {
          formPayload.append(
            "projectContacts",
            JSON.stringify(formData.projectContacts)
          );
        } else {
          formPayload.append(key, formData[key]);
        }
      });

      const response = await fetch(`${BASE_URL}/project-master/create`, {
        method: "POST",
        body: formPayload,
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result?.message || "Project create failed");
        return;
      }

      setShowForm(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.log(error);
    } finally {
      setInprogess(0);
    }
  };

  const handleDelelte = async (projectId) => {
    try {
      const confirmDelete = window.confirm("Are you sure?");
      if (!confirmDelete) return;

      await axios.delete(`${BASE_URL}/project-master/delete/${projectId}`);
      fetchProjects();
    } catch (error) {
      console.log(error?.message);
    }
  };

  const handleEdit = (projectId) => {
    navigate(`/project/update/${projectId}`);
  };

  const filteredProjects = projects.filter((proj) =>
    proj?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const handleView = (projectId) => {
    navigate(`/project/${projectId}`);
  };
  // Export Excel
  const formatContactsForExcel = (contacts = []) => {
    if (!Array.isArray(contacts) || contacts.length === 0) return "";

    return contacts
      .map(
        (person, index) =>
          `${index + 1}. ${person?.name || ""} | ${person?.designation || ""} | ${person?.email || ""
          } | ${person?.contactNumber || ""}`
      )
      .join("\n");
  };

  const handleExportProjects = () => {
    const exportData = filteredProjects.map((proj, index) => ({
      "S.No": index + 1,

      "Project Name": proj?.name || "",
      "Project Code": proj?.code || "",
      Description: proj?.description || "",
      Location: proj?.location || "",
      "Client Name": proj?.clientName || "",

      "Order Number": proj?.orderNumber || "",
      "Order Date": proj?.orderDate || "",
      "Order Amount": proj?.orderAmount || "",

      "Alloted Company": proj?.allotedCompany || "",
      "Type Of Work": proj?.typeOfWork || "",
      "DLP Period": proj?.dlpPeriod || "",
      "Completion Date": proj?.complitionDate || "",

      Manager: proj?.manager || "",
      Phone: proj?.phone || "",
      Status: proj?.status || "",
      "Progress %": proj?.progress || 0,

      "PO File": proj?.poFile || "",
      "PO File Public ID": proj?.poFilePublicId || "",

      "Consignee Name": proj?.consigneeName || "",
      "Consignee Address": proj?.consigneeAddress || "",
      "Place Of Delivery": proj?.placeOfDelivery || "",
      "GST Number": proj?.gstNumber || "",

      "Client Team Contacts": formatContactsForExcel(
        proj?.projectContacts?.client
      ),
      "Project Incharge Contacts": formatContactsForExcel(
        proj?.projectContacts?.project
      ),
      "Electrical Site Incharge Contacts": formatContactsForExcel(
        proj?.projectContacts?.electrical
      ),
      "HR Department Contacts": formatContactsForExcel(
        proj?.projectContacts?.hr
      ),
      "Accounts Department Contacts": formatContactsForExcel(
        proj?.projectContacts?.accounts
      ),
      "Safety Team Contacts": formatContactsForExcel(
        proj?.projectContacts?.safety
      ),
      "Store Team Contacts": formatContactsForExcel(
        proj?.projectContacts?.store
      ),

      "Created At": proj?.createdAt
        ? new Date(proj.createdAt).toLocaleString("en-IN")
        : "",
      "Updated At": proj?.updatedAt
        ? new Date(proj.updatedAt).toLocaleString("en-IN")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects Master");

    XLSX.writeFile(workbook, "Project_Master_All_Fields.xlsx");
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900/80 rounded-3xl shadow-xl border border-slate-800 p-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Projects Management</h1>
              <p className="text-slate-400 mt-1">
                Manage project master, PO details, contacts and progress.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {canManageProject && (
                <button
                  onClick={handleExportProjects}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl flex items-center gap-2 font-semibold"
                >
                  <Download size={18} />
                  Export All
                </button>
              )}

              {canManageProject && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-3 rounded-xl flex items-center gap-2 font-semibold"
                >
                  <Plus size={18} />
                  Add Project
                </button>
              )}
            </div>
          </div>

          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj._id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60 hover:shadow-2xl"
            >
              <div
                className="flex justify-between mb-4 cursor-pointer"
                onClick={() => navigate(`/project/${proj._id}`)}
              >
                <div className="flex gap-3">
                  <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20">
                    <Building2 className="text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {proj.name}
                    </h2>
                    <p className="text-slate-400">Code: {proj.code}</p>
                  </div>
                </div>

                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-sm">
                  {proj.status}
                </span>
              </div>

              <p className="text-sm text-slate-400 flex items-center gap-2">
                <MapPin size={14} /> {proj.location}
              </p>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-cyan-400">{proj.progress}%</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full">
                  <div
                    className="bg-cyan-400 h-2 rounded-full"
                    style={{ width: `${proj.progress || 0}%` }}
                  />
                </div>
              </div>


              <div className="border-t border-slate-800 mt-5 pt-4 flex gap-3">
                <button
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl flex justify-center gap-2 text-cyan-400"
                  onClick={() => handleView(proj._id)}
                >
                  <Eye size={16} /> View
                </button>
                {canManageProject && (
                  <button
                    className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl flex justify-center gap-2 text-cyan-400"
                    onClick={() => handleEdit(proj._id)}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                )}
                {canManageProject && (
                  <button
                    onClick={() => handleDelelte(proj._id)}
                    className="px-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-3xl p-6 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-1">Add New Project</h2>
            <p className="text-slate-400 mb-6">
              Fill project master details and add department-wise contacts.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <input name="name" placeholder="Project Name*" value={formData.name} onChange={handleChange} className="input-dark" />
              <input name="code" placeholder="Code*" value={formData.code} onChange={handleChange} className="input-dark" />
              <input name="location" placeholder="Location*" value={formData.location} onChange={handleChange} className="input-dark" />
              <input name="clientName" placeholder="Client Name*" value={formData.clientName} onChange={handleChange} className="input-dark" />
              <input name="manager" placeholder="Manager*" value={formData.manager} onChange={handleChange} className="input-dark" />
              <input name="phone" placeholder="Phone*" value={formData.phone} onChange={handleChange} className="input-dark" />

              <input name="orderNumber" placeholder="Order Number" value={formData.orderNumber} onChange={handleChange} className="input-dark" />
              <input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} className="input-dark" />
              <input name="orderAmount" placeholder="Order Amount" value={formData.orderAmount} onChange={handleChange} className="input-dark" />

              <select name="allotedCompany" value={formData.allotedCompany} onChange={handleChange} className="input-dark">
                <option value="">Select Company</option>
                <option value="Sachin Electrical Private Limited">Sachin Electrical Private Limited</option>
                <option value="Sachin Power Projects Private Limited">Sachin Power Projects Private Limited</option>
              </select>

              <input name="typeOfWork" placeholder="Type Of Work" value={formData.typeOfWork} onChange={handleChange} className="input-dark" />
              <input name="dlpPeriod" placeholder="DLP Period" value={formData.dlpPeriod} onChange={handleChange} className="input-dark" />
              <input type="date" name="complitionDate" value={formData.complitionDate} onChange={handleChange} className="input-dark" />

              <input name="consigneeName" placeholder="Consignee Name" value={formData.consigneeName} onChange={handleChange} className="input-dark" />
              <input name="placeOfDelivery" placeholder="Place Of Delivery" value={formData.placeOfDelivery} onChange={handleChange} className="input-dark" />
              <input name="gstNumber" placeholder="GST Number" value={formData.gstNumber} onChange={handleChange} className="input-dark" />

              <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="input-dark md:col-span-3" />

              <textarea name="consigneeAddress" placeholder="Consignee Address" value={formData.consigneeAddress} onChange={handleChange} className="input-dark md:col-span-3" />

              <input type="file" name="poFile" onChange={handleChange} className="input-dark md:col-span-3" />
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-cyan-400" />
                <h3 className="text-xl font-semibold">Project Contacts</h3>
              </div>

              <div className="space-y-5">
                {contactSections.map((section) => (
                  <div
                    key={section.key}
                    className="border border-slate-800 bg-slate-950/50 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-cyan-400">
                        {section.label}
                      </h4>

                      <button
                        type="button"
                        onClick={() => addContactRow(section.key)}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
                      >
                        <UserPlus size={15} />
                        Add Person
                      </button>
                    </div>

                    {formData.projectContacts[section.key]?.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No person added yet.
                      </p>
                    )}

                    <div className="space-y-3">
                      {formData.projectContacts[section.key]?.map(
                        (person, index) => (
                          <div
                            key={index}
                            className="grid md:grid-cols-5 gap-3 items-center"
                          >
                            <input
                              placeholder="Name"
                              value={person.name}
                              onChange={(e) =>
                                handleContactChange(
                                  section.key,
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="input-dark"
                            />

                            <input
                              placeholder="Designation"
                              value={person.designation}
                              onChange={(e) =>
                                handleContactChange(
                                  section.key,
                                  index,
                                  "designation",
                                  e.target.value
                                )
                              }
                              className="input-dark"
                            />

                            <input
                              placeholder="Email"
                              value={person.email}
                              onChange={(e) =>
                                handleContactChange(
                                  section.key,
                                  index,
                                  "email",
                                  e.target.value
                                )
                              }
                              className="input-dark"
                            />

                            <input
                              placeholder="Contact Number"
                              value={person.contactNumber}
                              onChange={(e) =>
                                handleContactChange(
                                  section.key,
                                  index,
                                  "contactNumber",
                                  e.target.value
                                )
                              }
                              className="input-dark"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                removeContactRow(section.key, index)
                              }
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddProject}
              disabled={inProgress}
              className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold py-3 rounded-xl"
            >
              {inProgress ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}