import React, { useContext, useState, useMemo, useEffect } from "react";
import {
    LayoutDashboard,
    Building2,
    Warehouse,
    FileText,
    LogOut,
    UserCircle,
    Bell,
    Search,
    Menu,
    Clipboard,
    ClipboardList,
    BarChart3,
    PackageSearch
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
    const { myTasks, assignedByMeTasks, fetchMyTasks, fetchAssignedByMeTasks } = useTasks();

    const [menuOpen, setMenuOpen] = useState(false);

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



    console.log(assignedByMeTasks)

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const navItems = [
        { title: "Dashboard", icon: LayoutDashboard, path: "/", roles: [] },
        { title: "Projects", icon: Building2, path: "/projects", roles: ["MIS User", "Project Manager", "Site Engineer"] },
        { title: "Stores", icon: Warehouse, path: "/store", roles: ["Store Manager", "MIS User"] },
        { title: "Tax Invoice", icon: FileText, path: "/TaxInvoiceListPage", roles: ["MIS User", "Accountant"] },
        { title: "Tax Analytics", icon: FileText, path: "/analytics/tax-invoice", roles: ["MIS User", "Accountant"] },
        { title: "Challan", icon: FileText, path: "/challan", roles: ["MIS User", "Store Manager", "Accountant"] },
        { title: "Material Analytics", icon: Warehouse, path: "/material-movement/analytics", roles: ["Store Manager", "MIS User"] },
        { title: "Reports", icon: BarChart3, path: '/reports/material-analytics', roles: ["Super Admin", "Admin"] },
        { title: "DPR", icon: FileText, path: "/dpr", roles: ["MIS User", "Site Engineer", "Project Manager"] },
        { title: "Party Master", icon: FileText, path: "/party", roles: ["MIS User", "Site Engineer", "Store Manager", "Accountant", "Project Manager"] },
        { title: "Users", icon: UserCircle, path: "/user/mang", roles: ["Super Admin", "Admin"] },
        { title: "Task  Management", icon: ClipboardList, path: null, roles: ["Super Admin", "Admin", "Project Manager"] },
        { title: "Item Management", icon: PackageSearch, path: "/item-identity", roles: ["Super Admin", "Admin", "Project Manager"] },
        { title: "Main Store Live Stock", icon: Warehouse, path: "/main-store-stock", roles: ["Super Admin", "Admin", "Project Manager"] },
        { title: "Site Store Live Stock", icon: Warehouse, path: "/site-store-stock", roles: ["Super Admin", "Admin", "Project Manager"] },
        { title: "Approval Challan ", icon: FileText, path: "/challan-approval", roles: ["Super Admin", "Admin", "Project Manager"] },
        { title: "Stock Transaction ", icon: FileText, path: "/stock-transactions", roles: [""] },
        

    ];

    const navBar = [
        // { title: "Dashboard", icon: LayoutDashboard, path: "/new-dashboard", roles: [] },
        { title: "Projects", icon: Building2, path: "/projects", roles: ["MIS User", "Project Manager", "Site Engineer"] },
        // { title: "Stores", icon: Warehouse, path: "/store", roles: ["Store Manager", "MIS User"] },
        { title: "Tax Invoice", icon: FileText, path: "/TaxInvoiceListPage", roles: ["MIS User", "Accountant"] },
        // { title: "Tax Analytics", icon: FileText, path: "/analytics/tax-invoice", roles: ["MIS User", "Accountant"] },
        { title: "Challan", icon: FileText, path: "/challan", roles: ["MIS User", "Store Manager", "Accountant"] },
        { title: "Material Analytics", icon: Warehouse, path: "/material-movement/analytics", roles: ["Store Manager", "MIS User"] },
        { title: "Reports", icon: BarChart3, path: '/reports/material-analytics', roles: ["Super Admin", "Admin"] }
        // { title: "DPR", icon: FileText, path: "/dpr", roles: ["MIS User", "Site Engineer", "Project Manager"] },
        // { title: "Party Master", icon: FileText, path: "/party", roles: ["MIS User", "Site Engineer", "Store Manager", "Accountant", "Project Manager"] },
        // { title: "Users", icon: UserCircle, path: "/user/mang", roles: ["Super Admin", "Admin"] },
        // { title: "Task  Management",  icon: ClipboardList,  path: null, roles: ["Super Admin", "Admin", "Project Manager"] },
    ];



    const hasAccess = (roles = []) => {
        if (!roles || roles.length === 0) return true;

        const role = user?.role?.trim();

        if (role === "Super Admin" || role === "Admin") return true;

        return roles.includes(role);
    };

    const allowedNavItems = navItems.filter((item) => hasAccess(item.roles));

    // console.log("USER ROLE:", user?.role);
    // console.log("ALLOWED MODULES:", allowedNavItems);
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
            })
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
            const res = await axios.get(`${BASE_URL}/project-master/all`, { headers })


            setProjects(res.data.data || []);
        } catch (error) {
            console.log(error);
        }
    };

    // Assigned by me task
    const getTaskModalData = () => {
        if (activeTaskView === "assignedByMe") {
            return assignedByMeTasks;
        }

        return getModalTasks();
    };
    useEffect(() => {
        fetchMyTasks();
        fetchProjects();

        if (canAssignTask) {
            fetchUsers();
            fetchAssignedByMeTasks();

        }
    }, []);
    return (
        <div className="min-h-screen bg-[#07111f] text-white relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[130px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500/20 blur-[130px] rounded-full" />

            <div className="relative z-10">
                {/* Top Header */}
                <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07111f]/80 backdrop-blur-xl">
                    <div className="px-6 py-4 flex items-center justify-between gap-6">
                        {/* Left */}
                        <div className="flex items-center gap-4">
                            <div
                                className="relative"
                                onMouseEnter={() => setMenuOpen(true)}
                                onMouseLeave={() => setMenuOpen(false)}
                            >
                                <button
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
                                >
                                    <Menu size={22} />
                                </button>

                                {menuOpen && (
                                    <div className="absolute left-0 top-11 w-80 rounded-3xl border border-white/10 bg-[#0F172A] backdrop-blur-xl shadow-2xl p-3 z-[9999]">
                                        <p className="px-3 py-2 text-xs font-semibold text-slate-400">
                                            Allowed Modules
                                        </p>

                                        <div className="space-y-1 max-h-[70vh] overflow-y-auto">
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
                                                            onClick={() => {
                                                                setMenuOpen(false);
                                                                navigate(item.path);
                                                            }}
                                                            className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"
                                                        >
                                                            <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                                                <Icon size={18} />
                                                            </span>

                                                            <span>{item.title}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                    Sachin Electrical MIS
                                </h1>
                                <p className="text-xs text-slate-400">
                                    Operational Control Center
                                </p>
                            </div>
                        </div>

                        {/* Center Nav */}
                        <nav className="hidden xl:flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-2">
                            {navBar.map((item) => {
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

                        {/* Right */}
                        <div className="flex items-center gap-3">
                            {/* <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2">
                                <Search size={17} className="text-slate-400" />
                                <input
                                    placeholder="Search module..."
                                    className="bg-transparent outline-none text-sm text-white placeholder:text-slate-500 w-44"
                                />
                            </div> */}

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
                                    className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTaskView === "assignedByMe"
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-400 hover:text-white"
                                        }`}
                                >
                                    Assigned By Me
                                </button>
                            )}
                            <button
                                onClick={() => setAddTaskOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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

                {/* Page Content */}
                <main className="px-6 py-6">
                    <Outlet />
                    <TaskListModal
                        isOpen={taskModalOpen}
                        onClose={() => setTaskModalOpen(false)}
                        tasks={getTaskModalData()}
                        type={activeTaskView === "assignedByMe" ? "assignedByMe" : taskModalType}
                        currentUser={user}
                    />


                    <AddTaskModal
                        isOpen={addTaskOpen}
                        onClose={() => setAddTaskOpen(false)}
                        mode={canAssignTask ? "assign" : "personal"}
                        users={canAssignTask ? users : null}
                        projects={projects}
                    />
                </main>
            </div>
        </div>
    );
}