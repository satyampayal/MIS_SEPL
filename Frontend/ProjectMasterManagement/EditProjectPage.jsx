import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserPlus, Trash2, Users } from "lucide-react";
import BASE_URL from "../config/api";

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
  helper:[],
  fire:[],
  hr: [],
  accounts: [],
  safety: [],
  store: [],
  contractor:[],
  superVisior:[],
};

const contactSections = [
  { key: "client", label: "Client Team" },
  { key: "project", label: "Project Incharge" },
  { key: "staff", label: "Staff Team" },
  { key: "electrical", label: "Electrical Team" },
  { key: "helper", label: "Helper" },
  { key: "fire", label: "FIre Team" },
  { key: "hr", label: "HR Department" },
  { key: "accounts", label: "Accounts Department" },
  { key: "safety", label: "Safety Team" },
  { key: "store", label: "Store Team" },
  { key: "contractor", label: "Contractor Base Team" },
  { key: "superVisior", label: "superVisior" },
  
  
];

export default function EditProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem("user")) || {};
  const userRole = loggedInUser?.role;
  const token = localStorage.getItem("token");

  const canEditProject = ["Super Admin", "Admin", "Manager"].includes(userRole);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    consigneeName: "",
    consigneeAddress: "",
    placeOfDelivery: "",
    gstNumber: "",
    status: "Active",
    progress: 0,
    poFile: null,
    poFileUrl: "",
    projectContacts: emptyProjectContacts,
  });

  const fetchProject = async () => {
    try {
      const res = await fetch(`${BASE_URL}/project-master/get/${projectId}`);
      const data = await res.json();

      const p = data.data;

      setFormData({
        ...p,
        poFile: null,
        poFileUrl: p?.poFile || "",
        projectContacts: {
          ...emptyProjectContacts,
          ...(p?.projectContacts || {}),
        },
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

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
      const updatedContacts = [...(prev.projectContacts?.[sectionKey] || [])];

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

  const handleUpdate = async () => {
    if (!canEditProject) {
      alert("You do not have permission to edit this project");
      return;
    }

    try {
      setSaving(true);

      const formPayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "poFileUrl") return;

        if (key === "projectContacts") {
          formPayload.append(
            "projectContacts",
            JSON.stringify(formData.projectContacts)
          );
        } else if (key === "poFile") {
          if (formData.poFile) {
            formPayload.append("poFile", formData.poFile);
          }
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formPayload.append(key, formData[key]);
        }
      });

      const res = await fetch(`${BASE_URL}/project-master/update/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      });

      const result = await res.json();

      if (res.ok) {
        alert("Project updated successfully 🚀");
        navigate(-1);
      } else {
        alert(result.message || "Update failed");
      }
    } catch (err) {
      console.log(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        Loading...
      </div>
    );
  }

  if (!canEditProject) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
          <p className="text-slate-400 mt-2">
            You do not have permission to edit projects.
          </p>

          <button
            onClick={() => navigate(-1)}
            className="mt-5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-5 py-3 rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    "bg-slate-950 border border-slate-700 text-slate-100 p-3 rounded-xl outline-none focus:border-cyan-400 placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-xl p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Edit Project</h1>
          <p className="text-slate-400 mt-1">
            Update project master details, PO details and department contacts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input name="name" value={formData.name || ""} onChange={handleChange} placeholder="Project Name" required className={inputClass} />
          <input name="code" value={formData.code || ""} onChange={handleChange} placeholder="Project Code" required className={inputClass} />

          <input name="location" value={formData.location || ""} onChange={handleChange} placeholder="Location" required className={inputClass} />
          <input name="clientName" value={formData.clientName || ""} onChange={handleChange} placeholder="Client Name" required className={inputClass} />

          <input name="manager" value={formData.manager || ""} onChange={handleChange} placeholder="Manager" required className={inputClass} />
          <input name="phone" value={formData.phone || ""} onChange={handleChange} placeholder="Phone" required className={inputClass} />

          <input name="orderNumber" value={formData.orderNumber || ""} onChange={handleChange} placeholder="Order Number" className={inputClass} />
          <input type="date" name="orderDate" value={formData.orderDate || ""} onChange={handleChange} className={inputClass} />

          <input name="orderAmount" value={formData.orderAmount || ""} onChange={handleChange} placeholder="Order Amount" className={inputClass} />

          <select name="allotedCompany" value={formData.allotedCompany || ""} onChange={handleChange} className={inputClass}>
            <option value="">Select Alloted Company</option>
            <option value="Sachin Electrical Private Limited">Sachin Electrical Private Limited</option>
            <option value="Sachin Power Projects Private Limited">Sachin Power Projects Private Limited</option>
          </select>

          <input name="typeOfWork" value={formData.typeOfWork || ""} onChange={handleChange} placeholder="Type of Work" className={inputClass} />
          <input name="dlpPeriod" value={formData.dlpPeriod || ""} onChange={handleChange} placeholder="DLP Period" className={inputClass} />

          <input type="date" name="complitionDate" value={formData.complitionDate || ""} onChange={handleChange} className={inputClass} />

          <select name="status" value={formData.status || "Active"} onChange={handleChange} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Hold">Hold</option>
          </select>

          <input type="number" name="progress" value={formData.progress || 0} onChange={handleChange} placeholder="Progress %" className={inputClass} />

          <input name="consigneeName" value={formData.consigneeName || ""} onChange={handleChange} placeholder="Consignee Name" className={inputClass} />

          <input name="gstNumber" value={formData.gstNumber || ""} onChange={handleChange} placeholder="GST Number" className={inputClass} />

          <input name="placeOfDelivery" value={formData.placeOfDelivery || ""} onChange={handleChange} placeholder="Place Of Delivery" className={inputClass} />

          <textarea name="description" value={formData.description || ""} onChange={handleChange} placeholder="Description" className={`${inputClass} md:col-span-2 min-h-[90px]`} />

          <textarea name="consigneeAddress" value={formData.consigneeAddress || ""} onChange={handleChange} placeholder="Consignee Address" className={`${inputClass} md:col-span-2 min-h-[100px]`} />

          <input type="file" name="poFile" onChange={handleChange} className={inputClass} />
        </div>

        {formData.poFileUrl && (
          <div className="mt-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <a
              href={formData.poFileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline font-medium"
            >
              View Existing PO
            </a>
          </div>
        )}

        <div className="mt-8 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Project Contacts</h2>
          </div>

          <div className="space-y-5">
            {contactSections.map((section) => (
              <div
                key={section.key}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-cyan-400">
                    {section.label}
                  </h3>

                  <button
                    type="button"
                    onClick={() => addContactRow(section.key)}
                    className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-3 py-2 rounded-xl flex items-center gap-2 text-sm"
                  >
                    <UserPlus size={15} />
                    Add Person
                  </button>
                </div>

                {formData.projectContacts?.[section.key]?.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No person added yet.
                  </p>
                )}

                <div className="space-y-3">
                  {formData.projectContacts?.[section.key]?.map(
                    (person, index) => (
                      <div
                        key={index}
                        className="grid md:grid-cols-5 gap-3 items-center"
                      >
                        <input
                          placeholder="Name"
                          value={person.name || ""}
                          onChange={(e) =>
                            handleContactChange(section.key, index, "name", e.target.value)
                          }
                          className={inputClass}
                        />

                        <input
                          placeholder="Designation"
                          value={person.designation || ""}
                          onChange={(e) =>
                            handleContactChange(section.key, index, "designation", e.target.value)
                          }
                          className={inputClass}
                        />

                        <input
                          placeholder="Email"
                          value={person.email || ""}
                          onChange={(e) =>
                            handleContactChange(section.key, index, "email", e.target.value)
                          }
                          className={inputClass}
                        />

                        <input
                          placeholder="Contact Number"
                          value={person.contactNumber || ""}
                          onChange={(e) =>
                            handleContactChange(section.key, index, "contactNumber", e.target.value)
                          }
                          className={inputClass}
                        />

                        <button
                          type="button"
                          onClick={() => removeContactRow(section.key, index)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl py-3 flex items-center justify-center gap-2"
                        >
                          <Trash2 size={15} />
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
          onClick={handleUpdate}
          disabled={saving}
          className="mt-6 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? "Updating..." : "Update Project"}
        </button>
      </div>
    </div>
  );
}