import React, { useContext, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Warehouse,
  Users,
  FileText,
  TrendingUp,
  LogOut,
  UserCircle,
  ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "./Context/AuthContext";
import TaskListModal from "./TaskListModal";
import AddTaskModal from "./AddTaskModal";
import BASE_URL from "../config/api";
export default function ModernDashboardLandingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const [totalTaxRegister, setTotalTaxRegister] = useState(0);
  const [totalSitesRegister, setTotalSitesRegister] = useState(0);
  const [totalMasterStores, setTotalMasterStores] = useState(0);
  const [totalDpr, setTotalDpr] = useState(0);
  const [totalPendingTasks, setTotalPendingTasks] = useState(0)
  const [pendingTaskCount, setPendingTaskCount] = useState(0)
  const [myTasks, setMyTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [addTaskMode, setAddTaskMode] = useState("personal");
  const [users, setUsers] = useState([]);
  const [challans, setChallans] = useState([]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [selectedTaskType, setSelectedTaskType] = useState("");

  const [filteredTasks, setFilteredTasks] = useState([]);

  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";
  const [refershTasks,SetRefreshTasks] = useState(false);

  const hasAccess = (roles = []) => {
    if (isAdmin) return true;
    return roles.includes(user?.role);
  };

  const allStats = [
    {
      title: "Active Projects",
      value: totalSitesRegister,
      icon: Building2,
      path: "/projects",
      roles: ["MIS User", "Project Manager", "Site Engineer"],
    },
    {
      title: "Total Stores",
      value: totalMasterStores,
      icon: Warehouse,
      path: "/store",
      roles: ["MIS User", "Store Manager"],
    },
    {
      title: "Total Challans",
      value: challans.length,
      icon: FileText,
      path: "/challan",
      roles: ["MIS User", "Store Manager", "Accountant"],
    },
    {
      title: "Total Tax Invoice Register",
      value: totalTaxRegister,
      icon: FileText,
      path: "/TaxInvoiceListPage",
      roles: ["MIS User", "Accountant"],
    },
    {
      title: "Total Value",
      value: "₹330,000",
      icon: TrendingUp,
      path: null,
      roles: ["MIS User", "Accountant", "Project Manager"],
    },
    {
      title: "Daily Progress Report",
      value: totalDpr,
      icon: FileText,
      path: "/dpr",
      roles: ["MIS User", "Site Engineer", "Project Manager"],
    },
    {
      title: "Manage Users",
      value: users.length,
      icon: Users,
      path: "/user/mang",
      roles: ["Super Admin", "Admin"],
    },
    {
      title: "My Panding  Tasks",
      value: pendingTaskCount,
      icon: ClipboardList,
      path: null,
      actionType: "myTasks",
      roles: [
        "MIS User",
        "Site Engineer",
        "Store Manager",
        "Accountant",
        "Project Manager"
      ]
    },
    {
      title: "Task  Management",
      value: allTasks.length || 0,
      icon: ClipboardList,
      path: null,
      actionType: "taskManagement",
      roles: ["Super Admin", "Admin", "Project Manager"]
    }
  ];

  const quickActions = [
    {
      title: "Add Tax Invoice",
      path: "/add-tax-invoice",
      roles: ["MIS User", "Accountant"],
    },
    {
      title: "Create Challan",
      path: "/challan",
      roles: ["MIS User", "Store Manager", "Accountant"],
    },
    {
      title: "Add Item At Site",
      path: "/add-item-at-site",
      roles: ["MIS User", "Store Manager"],
    },
    {
      title: "Daily Progress Report",
      path: "/dpr",
      roles: ["MIS User", "Site Engineer", "Project Manager"],
    },
    {
      title: "Manage Users",
      path: "/user/mang",
      roles: ["Super Admin", "Admin"],
    },
  ];

  const visibleStats = allStats.filter((item) => hasAccess(item.roles));
  const visibleQuickActions = quickActions.filter((item) =>
    hasAccess(item.roles)
  );

  const openTaskModal = (type) => {
    setSelectedTaskType(type);

    let data = [];

    const today = new Date().toDateString();

    if (type === "myPending") {
      data = myTasks.filter((task) => task.status === "pending");
    }

    if (type === "taskManagement") {
      data = allTasks.filter((task) => task.status !== "completed");
    }

    if (type === "today") {
      data = myTasks.filter(
        (task) => new Date(task.dueDate).toDateString() === today
      );
    }
    if(type==="myTasks"){
      data = myTasks;
    }
    if(type==="taskManagement"){
      data=allTasks;
    }

    setFilteredTasks(data);
    setIsTaskModalOpen(true);
  };

  const handleClick = (item) => {
    if (item.actionType === "myTasks") {
      openTaskModal("myTasks");
      return;
    }

    if (item.actionType === "taskManagement") {
      openTaskModal("taskManagement");
      return;
    }

    if (!item.path) {
      toast("This module is coming soon");
      return;
    }

    toast.success(`Opening ${item.title}`);
    navigate(item.path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [taxRes, projectRes, storeRes, dprRes, myTaskRes, allTaskRes, userRes,challanRes] =
        await Promise.allSettled([
          axios.get(`${BASE_URL}/tax-invoice/all`, { headers }),
          axios.get(`${BASE_URL}/project-master/all`, { headers }),
          axios.get(`${BASE_URL}/store-master/all`, { headers }),
          axios.get(`${BASE_URL}/dpr/all`, { headers }),
          axios.get(`${BASE_URL}/api/tasks/my-tasks`, { headers }),
          axios.get(`${BASE_URL}/api/tasks/all`, { headers }),
          axios.get(`${BASE_URL}/user/all`, { headers }),
          axios.get(`${BASE_URL}/challan/all`, { headers }),
        ]);

      if (taxRes.status === "fulfilled") {
        setTotalTaxRegister(taxRes.value.data.total || 0);
      }

      if (projectRes.status === "fulfilled") {
        setTotalSitesRegister(projectRes.value.data.data?.length || 0);
      }

      if (storeRes.status === "fulfilled") {
        setTotalMasterStores(storeRes.value.data.data?.length || 0);
      }

      if (dprRes.status === "fulfilled") {
        setTotalDpr(dprRes.value.data.reports?.length || 0);
      }
      if (myTaskRes.status === "fulfilled") {
        const tasks = myTaskRes.value.data.tasks || [];
        setMyTasks(tasks);

        const pending = tasks.filter((task) => task.status === "pending");
        setPendingTaskCount(pending.length);
      }

      if (allTaskRes.status === "fulfilled") {
        const tasks = allTaskRes.value.data.tasks || [];
        setAllTasks(tasks);

        const pending = tasks.filter((task) => task.status !== "completed");
        setTotalPendingTasks(pending.length);
      }
      if (userRes.status === "fulfilled") {
        // console.log("Users:", userRes.value.data.users);
        setUsers(userRes.value.data.users || []);
      }
      if (challanRes.status === "fulfilled") {
        // console.log("Challans:", challanRes.value.data.data);
        setChallans(challanRes.value.data.data || []);
      }
    } catch (error) {
      console.log(error);
      toast.error("Dashboard data loading failed");
    }
  };

  //Task 
  const handleAddTaskClick = () => {
    if (isAdmin) {
      setAddTaskMode("assign");
    } else {
      setAddTaskMode("personal");
    }

    setIsAddTaskModalOpen(true);
  };

  // handle Refersh tasks after add/edit/deletion
  const handleRefreshTasks = () => {
    setRefershTasks(!refershTasks);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refershTasks]);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold text-blue-600">
              Material Register
            </div>

            <nav className="flex flex-wrap gap-6 text-sm font-medium text-slate-700">
              <div className="flex items-center gap-2 border-b-2 border-blue-500 pb-1 text-blue-600">
                <LayoutDashboard size={18} /> Dashboard
              </div>

              {hasAccess(["MIS User", "Project Manager", "Site Engineer"]) && (
                <div
                  onClick={() => navigate("/projects")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Building2 size={18} /> Sites
                </div>
              )}

              {hasAccess(["MIS User", "Store Manager"]) && (
                <div
                  onClick={() => navigate("/store")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Warehouse size={18} /> Stores
                </div>
              )}

              {hasAccess(["MIS User", "Store Manager", "Accountant"]) && (
                <div
                  onClick={() => navigate("/challan")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={18} /> Challans
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-slate-800">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.role} | {user?.department}
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCircle size={28} />
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-3">
            Welcome, {user?.fullName || "User"}
          </h1>

          <p className="text-sm md:text-base opacity-90 max-w-2xl">
            You are logged in as{" "}
            <span className="font-semibold">{user?.role}</span>. Only your
            permitted modules are visible here.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleStats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                onClick={() => handleClick(item)}
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between cursor-pointer hover:shadow-md transition"
              >
                <div>
                  <p className="text-sm text-slate-500 mb-2">{item.title}</p>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {item.value}
                  </h2>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Icon size={28} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Your Operations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleQuickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleClick(action)}
                  className="rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition"
                >
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Available for {user?.role}
                  </p>
                </button>
              ))}
            </div>

            {visibleQuickActions.length === 0 && (
              <p className="text-slate-500 text-sm">
                No operations assigned to your role.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Me</h2>

            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border">
                <p className="text-slate-500">Name</p>
                <p className="font-semibold">{user?.fullName || "N/A"}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border">
                <p className="text-slate-500">Email</p>
                <p className="font-semibold">{user?.email || "N/A"}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border">
                <p className="text-slate-500">Role</p>
                <p className="font-semibold">{user?.role || "N/A"}</p>
              </div>

              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                Authentication verified successfully
              </div>
            </div>
          </div>
        </section>
      </main>
      <TaskListModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        tasks={filteredTasks}
        type={selectedTaskType}
        onAddTask={handleAddTaskClick}
        onRefreshTasks={handleRefreshTasks}
      />

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => {
          setIsAddTaskModalOpen(false);
          fetchDashboardData();
        }}
        mode={addTaskMode}
        users={users}
        onRefreshTasks={handleRefreshTasks}
      />
    </div>
  );
}