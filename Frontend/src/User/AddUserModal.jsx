import React, { useEffect, useState } from "react";
import { X, UploadCloud } from "lucide-react";
import BASE_URL from "../../config/api";

export default function AddUserModal({
  isOpen,
  onClose,
  mode,
  user,
  refreshUsers
}) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isAdd = mode === "add";

  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    mobileNumber: "",
    employeeId: "",
    department: "MIS",
    designation: "",
    role: "MIS User",
    address: "",
    profileImage: null
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        password: "",
        mobileNumber: user.mobileNumber || "",
        employeeId: user.employeeId || "",
        department: user.department || "MIS",
        designation: user.designation || "",
        role: user.role || "MIS User",
        address: user.address || "",
        profileImage: null
      });
    } else {
      setFormData({
        fullName: "",
        email: "",
        password: "",
        mobileNumber: "",
        employeeId: "",
        department: "MIS",
        designation: "",
        role: "MIS User",
        address: "",
        profileImage: null
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async () => {
    if (isView) return;

    try {
      const form = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          form.append(key, formData[key]);
        }
      });

      const url = isEdit
        ? `${BASE_URL}/user/update/${user._id}`
        : `${BASE_URL}/user/register`;

      const method = isEdit ? "PUT" : "POST";

      const headers = {};

      if (isEdit) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: form
      });

      const data = await res.json();

      if (data.success) {
        alert(isEdit ? "User updated successfully" : "User added successfully");
        refreshUsers();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log("User submit error:", error);
      alert("Server error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">
            {isAdd && "Add User"}
            {isEdit && "Edit User"}
            {isView && "View User"}
          </h2>

          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isView || isEdit}
          />

          {isAdd && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isView}
            />
          )}

          <Input
            label="Mobile Number"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            label="Employee ID"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            disabled={isView}
          />

          <Select
            label="Department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            disabled={isView}
            options={[
              "MIS",
              "Electrical",
              "HVAC",
              "Plumbing",
              "Fire Fighting",
              "Accounts",
              "Store",
              "Admin",
              "Management"
            ]}
          />

          <Input
            label="Designation"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            disabled={isView}
          />

          <Select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isView}
            options={[
              "Super Admin",
              "Admin",
              "Project Manager",
              "Site Engineer",
              "Store Manager",
              "MIS User",
              "Accountant"
            ]}
          />

          <Textarea
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isView}
          />

          {!isView && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Profile Image
              </label>

              <label className="mt-1 border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                <UploadCloud size={30} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">Upload image</p>

                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>

              {formData.profileImage && (
                <p className="text-green-600 text-sm mt-2">
                  {formData.profileImage.name}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>

          {!isView && (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {isEdit ? "Update User" : "Save User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ label, name, value, onChange, disabled }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows="3"
        className="w-full mt-1 border rounded-xl px-3 py-2 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}