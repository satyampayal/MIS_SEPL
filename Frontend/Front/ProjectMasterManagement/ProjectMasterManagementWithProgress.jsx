import React, { useEffect, useState } from "react";
import {
  MapPin,
  Building2,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
    typeOfWork: "SITC",
    dlpPeriod: "1 Year",
    complitionDate: "",
    manager: "",
    phone: "",
    status: "Active",
    progress: 0,
    poFile: null
  });

  // Fetch
  const fetchProjects = async () => {
    try {
      const response = await fetch("http://localhost:5000/project-master/all");
      const result = await response?.json();
      setprojects(result?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle Change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Add Project
  const handleAddProject = async () => {
    try {
      setInprogess(1);

      const formPayload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "poFile") {
          if (formData.poFile) {
            formPayload.append("poFile", formData.poFile);
          }
        } else {
          formPayload.append(key, formData[key]);
        }
      });

      const response = await fetch(
        "http://localhost:5000/project-master/create",
        {
          method: "POST",
          body: formPayload,
        }
      );

      const result = await response.json();
      console.log(result);

      setShowForm(false);
      setInprogess(0);

      setFormData({
        name: "",
        code: "",
        description: "",
        location: "",
        clientName: "",
        orderNumber: "",
        orderDate: "",
        typeOfWork: "SITC",
        dlpPeriod: "1 Year",
        complitionDate: "",
        manager: "",
        phone: "",
        status: "Active",
        progress: 0,
        poFile: null
      });

      fetchProjects(); // ✅ fixed
    } catch (error) {
      console.log(error);
    }
  };

  // Delete
  const handleDelelte = async (projectId) => {
    try {
      const confirmDelete = window.confirm("Are you sure?");
      if (!confirmDelete) return;

      await axios.delete(
        `http://localhost:5000/project-master/delete/${projectId}`
      );

      fetchProjects();
    } catch (error) {
      console.log(error?.message);
    }
  };
  const handleEdit=(projectId)=>{
    navigate(`/project/update/${projectId}`)
  }

  const filteredProjects = projects.filter((proj) =>
    proj?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Projects Management</h1>

            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              Add Project
            </button>
          </div>

          <input
            type="text"
            placeholder="Search project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 ">
          {filteredProjects.map((proj) => (
            <div key={proj._id} className="bg-white rounded-3xl shadow-sm border p-6   
            transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl  hover:-translate-y-1">

              <div className="flex justify-between mb-4 cursor-pointer"
                onClick={() => navigate(`/project/${proj._id}`)}
              >
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Building2 className="text-blue-600" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">{proj.name}</h2>
                    <p className="text-gray-500">Code: {proj.code}</p>
                  </div>
                </div>

                <span className="bg-green-100 text-green-700 px-3 py-3 rounded-xl   text-sm">
                  {proj.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin size={14} /> {proj.location}
              </p>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{proj.progress}%</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="border-t mt-5 pt-4 flex gap-3">
                <button className="flex-1 bg-gray-100 py-2 rounded-xl 
                flex justify-center gap-2 text-blue-600 cursor-pointer
                "  
                onClick={()=>handleEdit(proj._id)}
                >
                  <Pencil size={16} /> Edit
                </button>

                <button
                  onClick={() => handleDelelte(proj._id)}
                  className="px-4 bg-red-50 rounded-xl text-red-500 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative">

            {/* Close */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-500"
            >
              <X />
            </button>

            <h2 className="text-2xl font-bold mb-4">Add New Project</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input name="name" placeholder="Project Name*" value={formData.name} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input name="code" placeholder="Code*" value={formData.code} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input name="location" placeholder="Location*" value={formData.location} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input name="manager" placeholder="Manager*" value={formData.manager} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input name="phone" placeholder="Phone*" value={formData.phone} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input name="clientName" placeholder="Client Name*" value={formData.clientName} onChange={handleChange} required className="border rounded-xl px-4 py-3" />
              <input type="file" name="poFile" onChange={handleChange} className="border p-2 rounded-xl" />
            </div>

            <button
              onClick={handleAddProject}
              className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl"
            >
              {inProgress ? "Saving..." : "Save Project"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}