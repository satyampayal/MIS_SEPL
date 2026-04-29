import React, { useEffect, useState } from "react";
import { MapPin, Building2, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
export default function ProjectMasterManagementWithProgress() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [inProgress, setInprogess] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    manager: "",
    phone: "",
    startDate: "",
    status: "Active",
    progress: 0,
    poFile: "",
    description:""
  });

  // Fetch all sites from DB
  const fetchSites = async () => {
    try {
      const response = await fetch("http://localhost:5000/project-master/all");
      const result = await response?.json();
      setSites(result?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add new site API
  const handleAddSite = async () => {
    try {
      setInprogess(() => 1)

      const formPayload = new FormData();

      formPayload.append("name", formData.name);
      formPayload.append("code", formData.code);
      formPayload.append("location", formData.location);
      formPayload.append("manager", formData.manager);
      formPayload.append("phone", formData.phone);
      formPayload.append("startDate", formData.startDate);
      formPayload.append("status", formData.status);
      formPayload.append("progress", formData.progress);
      formPayload.append("description",formData.description)

      if (formData.poFile) {
        console.log("Po FIle hai bahi ")
        formPayload.append("poFile", formData.poFile);
      }

      const response = await fetch("http://localhost:5000/project-master/create",
        {
          method: "POST",
          body: formPayload,
        });

      const result = await response.json();
      console.log(result);
      setShowForm(false);
      setFormData({
        name: "",
        code: "",
        location: "",
        manager: "",
        phone: "",
        startDate: "",
        status: "Active",
        progress: 0,
        poFile: ""
      });
      setInprogess(() => 0)

      fetchSites();
    } catch (error) {
      console.log(error);
    }
  };

  const filteredSites = sites.filter((site) =>
    site.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelelte = async (projectId) => {
    try {
      if (!projectId) {
      alert("Not have proper ID");
        return 
      }
      const confirmDelete = window.confirm("Are you sure to delete this item?");
      if (!confirmDelete) {
        return;
      }
      const response = await axios.delete(`http://localhost:5000/project-master/delete/${projectId}`);
       if (response?.status === 200) {
                fetchSites(); // Refresh the item list
            }


    }
    catch (error) {
      console.log(error?.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-white rounded-3xl shadow-sm border p-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-3"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Site Management</h1>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              Add Site
            </button>
          </div>

          <input
            type="text"
            placeholder="Search sites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none"
          />
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Site</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <input name="name" placeholder="Project Name" value={formData.name} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input name="code" placeholder="Project Code" value={formData.code} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input name="description" placeholder="Project description" value={formData.description} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input name="manager" placeholder="Project Manager Name" value={formData.manager} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input type="number" name="progress" placeholder="Progress %" value={formData.progress} onChange={handleChange} className="border rounded-xl px-4 py-3" />
              <input type="file" name="poFile" accept=".pdf,.jpg,.png,.jpeg" onChange={(e) =>
                setFormData({
                  ...formData, poFile: e.target.files[0]
                })
              }
              />
            </div>

            <button
              onClick={handleAddSite}
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
            >{
                inProgress == 1 ? 'Saving ' : 'save site'
              }
              {/* Save Site */}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSites.map((site) => (
            <div
              key={site._id}
              className="bg-white rounded-3xl shadow-sm border p-6"
              onClick={()=>navigate("/billing")}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Building2 className="text-blue-600" size={24} />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">{site.name}</h2>
                    <p className="text-gray-500">Code: {site.code}</p>
                  </div>
                </div>

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                  {site.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <MapPin size={16} /> {site.location}
                </p>
                <p><span className="font-semibold">Manager:</span> {site.manager}</p>
                <p><span className="font-semibold">Phone:</span> {site.phone}</p>
                <p><span className="font-semibold">Start Date:</span> {site.startDate}</p>
                {site?.poFileUrl !== "" ?
                  <div className="flex gap-3 mt-4">
                    <a
                      href={site.poFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                    >
                      View PO
                    </a>

                    <a
                      href={site.poFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-4 py-2 rounded-xl"
                    >
                      Download PO
                    </a>
                  </div>
                  : <span></span>}


              </div>


              <div className="mt-5">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Project Progress</span>
                  <span className="font-semibold">{site.progress}%</span>
                </div>


                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${site.progress}%` }}
                  />
                </div>
              </div>

              <div className="border-t mt-6 pt-4 flex gap-3">
                <button className="flex-1 bg-gray-100 rounded-xl py-3 flex justify-center items-center gap-2 text-blue-600 font-medium">
                  <Pencil size={16} />
                  Edit
                </button>

                <button className="px-4 bg-red-50 rounded-xl text-red-500" onClick={()=>handleDelelte(site._id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
