import React, { useContext, useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Warehouse,
  FileText,
  LogOut,
  UserCircle,
  Bell,
  Menu,
  ClipboardList,
  BarChart3,
  PackageSearch,
  X,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../Context/AuthContext";
import { useTasks } from "../Context/TaskContext";
import TaskListModal from "../pages/Task/TaskListModal";
import AddTaskModal from "../pages/Task/AddTaskModal";
import BASE_URL from "../../config/api";
import axios from "axios";

export default function MainLayout() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const {
    myTasks,
    assignedByMeTasks,
    fetchMyTasks,
    fetchAssignedByMeTasks,
  } = useTasks();

  const [menuOpen, setMenuOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalType, setTaskModalType] = useState("tasks");
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTaskView, setActiveTaskView] = useState("my");

  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";

  const canAssignTask = ["Super Admin", "Admin", "Manager"].includes(
    user?.role
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, path: "/", roles: [] },
    {
      title: "Projects",
      icon: Building2,
      path: "/projects",
      roles: ["MIS User", "Project Manager", "Site Engineer"],
    },
    {
      title: "Stores",
      icon: Warehouse,
      path: "/store",
      roles: ["Store Manager", "MIS User"],
    },
    {
      title: "Tax Invoice",
      icon: FileText,
      path: "/TaxInvoiceListPage",
      roles: ["MIS User", "Accountant"],
    },
    {
      title: "Tax Analytics",
      icon: FileText,
      path: "/analytics/tax-invoice",
      roles: ["MIS User", "Accountant"],
    },
    {
      title: "Challan",
      icon: FileText,
      path: "/challan",
      roles: ["MIS User", "Store Manager", "Accountant"],
    },
    {
      title: "Material Analytics",
      icon: Warehouse,
      path: "/material-movement/analytics",
      roles: ["Store Manager", "MIS User"],
    },
    {
      title: "Reports",
      icon: BarChart3,
      path: "/reports/material-analytics",
      roles: ["Super Admin", "Admin"],
    },
    {
      title: "DPR",
      icon: FileText,
      path: "/dpr",
      roles: ["MIS User", "Site Engineer", "Project Manager"],
    },
    {
      title: "Party Master",
      icon: FileText,
      path: "/party",
      roles: [
        "MIS User",
        "Site Engineer",
        "Store Manager",
        "Accountant",
        "Project Manager",
      ],
    },
    {
      title: "Users",
      icon: UserCircle,
      path: "/user/mang",
      roles: ["Super Admin", "Admin"],
    },
    {
      title: "Task Management",
      icon: ClipboardList,
      path: null,
      roles: ["Super Admin", "Admin", "Project Manager"],
    },
    {
      title: "Item Management",
      icon: PackageSearch,
      path: "/item-identity",
      roles: ["Super Admin", "Admin", "Project Manager"],
    },
    {
      title: "Main Store Live Stock",
      icon: Warehouse,
      path: "/main-store-stock",
      roles: ["Super Admin", "Admin", "Project Manager"],
    },
    {
      title: "Site Store Live Stock",
      icon: Warehouse,
      path: "/site-store-stock",
      roles: ["Super Admin", "Admin", "Project Manager"],
    },
    {
      title: "Approval Challan",
      icon: FileText,
      path: "/challan-approval",
      roles: ["Super Admin", "Admin", "Project Manager"],
    },
    {
      title: "Stock Transaction",
      icon: FileText,
      path: "/stock-transactions",
      roles: ["Super Admin", "Admin", "MIS User", "Store Manager"],
    },
    {
      title: "Project Material Planning",
      icon: PackageSearch,
      path: "/project-material-planning",
      roles: ["Super Admin", "Admin", "Manager", "MIS"],
    },{
       
             title: "MRQ",
            icon: ClipboardList,
            path: "/material-requisition",
            // actionType: "materialMovementHistory",
          // roles: ["Store Manager", "MIS User"],   
          
    }
  ];

  const navBar = [
    {
      title: "Projects",
      icon: Building2,
      path: "/projects",
      roles: ["MIS User", "Project Manager", "Site Engineer"],
    },
    {
      title: "Tax Invoice",
      icon: FileText,
      path: "/TaxInvoiceListPage",
      roles: ["MIS User", "Accountant"],
    },
    {
      title: "Challan",
      icon: FileText,
      path: "/challan",
      roles: ["MIS User", "Store Manager", "Accountant"],
    },
    {
      title: "Measurement  Book",
      icon: Warehouse,
      path: "/measurement-book",
      roles: ["Store Manager", "MIS User"],
    },
    {
      title: "BOQ",
      icon: BarChart3,
      path: "/boq",
      roles: ["Super Admin", "Admin"],
    },
      {
      title: "DPR",
      icon: BarChart3,
      path: "/dpr",
      roles: ["Super Admin", "Admin"],
    },
  ];

  const hasAccess = (roles = []) => {
    if (!roles || roles.length === 0) return true;

    const role = user?.role?.trim();

    if (role === "Super Admin" || role === "Admin") return true;

    return roles.includes(role);
  };

  const allowedNavItems = navItems.filter((item) => hasAccess(item.roles));
  const allowedTopNavItems = navBar.filter((item) => hasAccess(item.roles));

  const taskStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      pending: myTasks.filter((t) => t.status === "pending"),
      inProgress: myTasks.filter((t) => t.status === "in_progress"),
      completed: myTasks.filter((t) => t.status === "completed"),
      urgent: myTasks.filter(
        (t) => t.priority === "urgent" && t.status !== "completed"
      ),
      overdue: myTasks.filter((t) => {
        if (!t.dueDate || t.status === "completed") return false;

        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);

        return due < today;
      }),
    };
  }, [myTasks]);

  const openTaskModal = (type) => {
    setTaskModalType(type);
    setTaskModalOpen(true);
  };

  const getModalTasks = () => {
    switch (taskModalType) {
      case "pending":
        return taskStats.pending;
      case "inProgress":
        return taskStats.inProgress;
      case "completed":
        return taskStats.completed;
      case "urgent":
        return taskStats.urgent;
      case "overdue":
        return taskStats.overdue;
      default:
        return myTasks;
    }
  };

  const getTaskModalData = () => {
    if (activeTaskView === "assignedByMe") return assignedByMeTasks;
    return getModalTasks();
  };

  const handleNavigate = (item) => {
    setMenuOpen(false);

    if (!item.path && item.title === "Task Management") {
      setActiveTaskView("my");
      openTaskModal("tasks");
      return;
    }

    if (item.path) navigate(item.path);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const res = await axios.get(`${BASE_URL}/user/all`, { headers });
      setUsers(res.data.users || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const res = await axios.get(`${BASE_URL}/project-master/all`, {
        headers,
      });

      setProjects(res.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    fetchProjects();

    if (canAssignTask) {
      fetchUsers();
      fetchAssignedByMeTasks();
    }
  }, []);

const refreshTasks = async () => {
  await fetchMyTasks();

  if (canAssignTask) {
    await fetchAssignedByMeTasks();
  }
};

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 40) {
        setHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 120) {
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEsc = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#07111f] text-white relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[130px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500/20 blur-[130px] rounded-full" />

      <div className="relative z-10">
        {/* Top Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl transition-all duration-300 ease-in-out ${
            headerVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0"
          }`}
        >
          <div className="px-6 py-4 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
              >
                <Menu size={22} />
              </button>

              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Sachin Electrical MIS
                </h1>
                <p className="text-xs text-slate-400">
                  Operational Control Center
                </p>
              </div>
            </div>

            <nav className="hidden xl:flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2">
              {allowedTopNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/10 transition"
                  >
                    <Icon size={17} />
                    {item.title}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveTaskView("my");
                  openTaskModal("tasks");
                }}
                className="relative rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-200 hover:bg-slate-800"
              >
                <Bell size={20} />

                {taskStats.pending.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {taskStats.pending.length}
                  </span>
                )}
              </button>

              {canAssignTask && (
                <button
                  onClick={() => {
                    setActiveTaskView("assignedByMe");
                    setTaskModalType("assignedByMe");
                    setTaskModalOpen(true);
                  }}
                  className={`hidden md:inline-flex rounded-xl px-4 py-2 text-sm font-medium transition ${
                    activeTaskView === "assignedByMe"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Assigned By Me
                </button>
              )}

              <button
                onClick={() => setAddTaskOpen(true)}
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <ClipboardList size={17} />
                Add Task
              </button>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">
                  {user?.fullName || "User"}
                </p>
                <p className="text-xs text-slate-400">
                  {isAdmin ? "Super Admin" : user?.role}
                </p>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <UserCircle size={27} />
              </div>

              <button
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20"
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </header>

        {/* Sidebar Overlay */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Click Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-[90] h-screen w-[340px] max-w-[88vw] border-r border-white/10 bg-[#0F172A]/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <div>
              <h2 className="text-lg font-bold text-white">Allowed Modules</h2>
              <p className="text-xs text-slate-400">
                Click any module to navigate
              </p>
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={21} />
            </button>
          </div>

          <div className="h-[calc(100vh-82px)] overflow-y-auto p-3">
            {allowedNavItems.length === 0 ? (
              <p className="px-3 py-4 text-sm text-red-300">
                No modules allowed for this role
              </p>
            ) : (
              allowedNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item)}
                    className="group mb-1 w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
                      <Icon size={18} />
                    </span>

                    <span className="font-medium">{item.title}</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Page Content */}
        <main className="px-6 pb-6 pt-28">
          <Outlet />

          <TaskListModal
            isOpen={taskModalOpen}
            onClose={() => setTaskModalOpen(false)}
            tasks={getTaskModalData()}
            type={
              activeTaskView === "assignedByMe"
                ? "assignedByMe"
                : taskModalType
            }
            currentUser={user}
            onRefreshTasks={refreshTasks}

          />

          <AddTaskModal
            isOpen={addTaskOpen}
            onClose={() => setAddTaskOpen(false)}
            mode={canAssignTask ? "assign" : "personal"}
            users={canAssignTask ? users : null}
            projects={projects}
            onRefreshTasks={refreshTasks}
          />
        </main>
      </div>
    </div>
  );
}