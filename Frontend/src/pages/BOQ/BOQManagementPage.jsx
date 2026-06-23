import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import BASE_URL from "../../../config/api";
import CreateBOQModal from "./components/CreateBOQModal";
import BOQItemsModal from "./components/BOQItemsModal";
import AddBOQItemModal from "./components/AddBOQItemModal";
import UploadBOQExcelModal from "./components/UploadBOQExcelModal";
import { useNavigate } from "react-router-dom";

const BOQ_API = `${BASE_URL}/boq`;
const PROJECT_API = `${BASE_URL}/project-master/all`;
const CONTRACTOR_API = `${BASE_URL}/contractor`;

export default function BOQManagementPage() {
    const navigate = useNavigate();

    const emptyBOQForm = {
        projectRef: "",
        contractorRef: "",
        boqName: "",
        boqType: "CLIENT",
        revisionNo: 0,
        remarks: "",
    };

    const emptyItemForm = {
        boqItemCode: "",
        boqSrNo: "",
        activity: "",
        generalName: "",
        description: "",
        uom: "",
        poQty: "",
        supplyRate: "",
        installationRate: "",
        contractorInstallationRate: "",
        category: "",
        subCategory: "",
        aliasesText: "",
        remarks: "",
    };

    const [uploadModalOpen, setUploadModalOpen] = useState(false);



    const [addItemModal, setAddItemModal] = useState(false);
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [savingItem, setSavingItem] = useState(false);

    const [createModal, setCreateModal] = useState(false);
    const [boqForm, setBoqForm] = useState(emptyBOQForm);
    const [savingBOQ, setSavingBOQ] = useState(false);
    const [projects, setProjects] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [boqs, setBoqs] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(false);

    const [itemsModal, setItemsModal] = useState(false);
    const [selectedBOQ, setSelectedBOQ] = useState(null);
    const [boqItems, setBoqItems] = useState([]);
    const [itemsLoading, setItemsLoading] = useState(false);

    const [itemMode, setItemMode] = useState("add");
    const [editingItem, setEditingItem] = useState(null);

    const fetchProjects = async () => {
        const res = await axios.get(PROJECT_API);
        setProjects(res.data.data || []);
    };

    const fetchContractors = async () => {
        const res = await axios.get(`${CONTRACTOR_API}/all`);
        setContractors(res.data.contractors || []);
    };

    const fetchBoqs = async () => {
        if(!selectedProject) return;

        try {
          
            setLoading(true);
        // if (!selectedProject) {
        //         const   res = await axios.get(`${BOQ_API}/all}`);
        // } else
        // {
        //     const   res=  await axios.get(`${BOQ_API}/project/${selectedProject}`);

        // }
            const   res=  await axios.get(`${BOQ_API}/project/${selectedProject}`);
            
           
            setBoqs(res.data.boqs || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch BOQ");
        } finally {
            setLoading(false);
        }
    };

    const createBOQ = async () => {
        try {
            if (!boqForm.projectRef) return toast.error("Select project");
            if (!boqForm.boqName.trim()) return toast.error("Enter BOQ name");

            if (boqForm.boqType === "CONTRACTOR" && !boqForm.contractorRef) {
                return toast.error("Select contractor");
            }

            setSavingBOQ(true);

            await axios.post(`${BOQ_API}/create`, {
                ...boqForm,
                revisionNo: Number(boqForm.revisionNo || 0),
                contractorRef:
                    boqForm.boqType === "CONTRACTOR" ? boqForm.contractorRef : null,
            });

            toast.success("BOQ created successfully");
            setCreateModal(false);
            setBoqForm(emptyBOQForm);

            if (selectedProject === boqForm.projectRef) {
                fetchBoqs();
            } else {
                setSelectedProject(boqForm.projectRef);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to create BOQ");
        } finally {
            setSavingBOQ(false);
        }
    };

    const openBOQItems = async (boq) => {
        try {
            setSelectedBOQ(boq);
            setItemsModal(true);
            setItemsLoading(true);

            const res = await axios.get(`${BOQ_API}/items/${boq._id}`);

            setBoqItems(res.data.items || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch BOQ items");
        } finally {
            setItemsLoading(false);
        }
    };

    const saveBOQItem = async () => {
        try {
            if (!selectedBOQ?._id) return toast.error("Select BOQ first");

            if (!itemForm.activity.trim() && !itemForm.description.trim()) {
                return toast.error("Activity or description is required");
            }

            if (!itemForm.poQty || Number(itemForm.poQty) <= 0) {
                return toast.error("Enter valid PO qty");
            }

            setSavingItem(true);

            const payload = {
                boqItemCode: itemForm.boqItemCode,
                boqSrNo: itemForm.boqSrNo,
                activity: itemForm.activity,
                generalName: itemForm.generalName,
                description: itemForm.description,
                uom: itemForm.uom,
                poQty: Number(itemForm.poQty || 0),
                supplyRate: Number(itemForm.supplyRate || 0),
                installationRate: Number(itemForm.installationRate || 0),
                contractorInstallationRate: Number(
                    itemForm.contractorInstallationRate || 0
                ),
                category: itemForm.category,
                subCategory: itemForm.subCategory,
                aliases: itemForm.aliasesText
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                remarks: itemForm.remarks,
            }

            if (itemMode === "edit" && editingItem?._id) {
                await axios.put(`${BOQ_API}/item/${editingItem._id}`, payload);
                toast.success("BOQ item updated");
            } else {
                await axios.post(`${BOQ_API}/${selectedBOQ._id}/item`, payload);
                toast.success("BOQ item added");
            }

            toast.success("BOQ item added");

            setAddItemModal(false);
            setItemForm(emptyItemForm);

            await openBOQItems(selectedBOQ);
            await fetchBoqs();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to add BOQ item");
        } finally {
            setSavingItem(false);
        }
    };

    const openEditItem = (item) => {
        setItemMode("edit");
        setEditingItem(item);

        setItemForm({
            boqItemCode: item.boqItemCode || "",
            boqSrNo: item.boqSrNo || "",
            activity: item.activity || "",
            generalName: item.generalName || "",
            description: item.description || "",
            uom: item.uom || "",
            poQty: item.poQty || "",
            supplyRate: item.supplyRate || "",
            installationRate: item.installationRate || "",
            contractorInstallationRate: item.contractorInstallationRate || "",
            category: item.category || "",
            subCategory: item.subCategory || "",
            aliasesText: item.aliases?.join(", ") || "",
            remarks: item.remarks || "",
        });

        setAddItemModal(true);
    };

    const openUploadModal = (boq) => {
        setSelectedBOQ(boq);
        setUploadModalOpen(true);
    };

    const closeUploadModal = () => {
        setSelectedBOQ(null);
        setUploadModalOpen(false);
    };
    useEffect(() => {
        fetchProjects();
        fetchContractors();
    }, []);

    useEffect(() => {
        fetchBoqs();
    }, [selectedProject]);

    return (
        <div className="min-h-screen bg-slate-950 p-4 text-slate-100 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-300">BOQ Control</p>
                    <h1 className="text-2xl font-bold">BOQ Management</h1>
                    <p className="text-sm text-slate-400">
                        Upload, manage and track project BOQ for MB and DPR linking.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setBoqForm({
                            ...emptyBOQForm,
                            projectRef: selectedProject || "",
                        });
                        setCreateModal(true);
                    }}
                    className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950"
                >
                    Create BOQ
                </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
                >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                            {p.projectName || p.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={fetchBoqs}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3"
                >
                    Refresh
                </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                        <tr>
                            <th className="p-4 text-left">BOQ Name</th>
                            <th className="p-4 text-left">Type</th>
                            <th className="p-4 text-left">Contractor</th>
                            <th className="p-4 text-left">Items</th>
                            <th className="p-4 text-left">Amount</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400">
                                    Loading BOQ...
                                </td>
                            </tr>
                        ) : boqs.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-slate-400">
                                    Select project or no BOQ found
                                </td>
                            </tr>
                        ) : (
                            boqs.map((boq) => (
                                <tr key={boq._id} className="border-t border-slate-800">
                                    <td className="p-4 font-semibold">{boq.boqName}</td>
                                    <td className="p-4">{boq.boqType}</td>
                                    <td className="p-4">
                                        {boq.contractorRef?.contractorName || "Client BOQ"}
                                    </td>
                                    <td className="p-4">{boq.totalItems || 0}</td>
                                    <td className="p-4">
                                        ₹{Number(boq.totalContractorAmount || boq.totalBoqAmount || 0).toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-4">{boq.status}</td>
                                    <td className="p-4 text-center grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => navigate(`/boq/${boq._id}`)}
                                            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                                        >
                                            View BOQ
                                        </button>
                                        {/* <button
                                            onClick={() => openBOQItems(boq)}
                                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950"
                                        >
                                            View Items
                                        </button> */}
                                        <button
                                            onClick={() => openUploadModal(boq)}
                                            className="px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20"
                                        >
                                            Upload Excel
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {createModal && (
                <CreateBOQModal
                    form={boqForm}
                    setForm={setBoqForm}
                    projects={projects}
                    contractors={contractors}
                    saving={savingBOQ}
                    onClose={() => setCreateModal(false)}
                    onSave={createBOQ}
                />
            )}

            {itemsModal && selectedBOQ && (
                <BOQItemsModal
                    boq={selectedBOQ}
                    items={boqItems}
                    loading={itemsLoading}
                    onClose={() => {
                        setItemsModal(false);
                        setSelectedBOQ(null);
                        setBoqItems([]);
                    }}
                    onAddItem={() => {
                        setItemMode("add");
                        setEditingItem(null);
                        setItemForm(emptyItemForm);
                        setAddItemModal(true);
                    }}
                    onEditItem={openEditItem}
                />
            )}

            {addItemModal && (
                <AddBOQItemModal
                    form={itemForm}
                    setForm={setItemForm}
                    saving={savingItem}
                    onClose={() => setAddItemModal(false)}
                    onSave={saveBOQItem}
                    mode={itemMode}
                />
            )}

            {uploadModalOpen && selectedBOQ && (
                <UploadBOQExcelModal
                    boq={selectedBOQ}
                    onClose={closeUploadModal}
                    onSuccess={() => {
                        closeUploadModal();
                        fetchBoqs();
                    }}
                />
            )}
        </div>
    );
}