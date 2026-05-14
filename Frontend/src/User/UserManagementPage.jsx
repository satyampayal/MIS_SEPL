import React, { useEffect, useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddUserModal from "../User/AddUserModal";
import BASE_URL from "../../config/api";

export default function UserManagementPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.log("Fetch users error:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAdd = () => {
    setSelectedUser(null);
    setMode("add");
    setIsModalOpen(true);
  };

  const openView = (user) => {
    setSelectedUser(user);
    setMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setMode("edit");
    setIsModalOpen(true);
  };

  const handleStatus = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/user/status/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        fetchUsers();
      }
    } catch (error) {
      console.log("Status error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${BASE_URL}/user/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="bg-white p-2 rounded-xl shadow"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-gray-500 text-sm">
              Manage MIS users, roles and access
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <Card title="Total Users" value={users.length} />
        <Card
          title="Active Users"
          value={users.filter((u) => u.isActive).length}
        />
        <Card
          title="Inactive Users"
          value={users.filter((u) => !u.isActive).length}
        />
        <Card
          title="Admins"
          value={users.filter((u) => u.role === "Admin").length}
        />
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Department</th>
              <th className="p-4 text-left">Mobile</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-gray-500 text-xs">{user.email}</p>
                  </div>
                </td>

                <td className="p-4">{user.role}</td>
                <td className="p-4">{user.department}</td>
                <td className="p-4">{user.mobileNumber || "N/A"}</td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => openView(user)}
                      className="text-blue-600"
                    >
                      <Eye size={18} />
                    </button>

                    <button
                      onClick={() => openEdit(user)}
                      className="text-green-600"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      onClick={() => handleStatus(user._id)}
                      className={
                        user.isActive ? "text-orange-600" : "text-green-600"
                      }
                    >
                      {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                    </button>

                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={mode}
        user={selectedUser}
        refreshUsers={fetchUsers}
      />
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}