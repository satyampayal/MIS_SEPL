import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Plus,
    Search,
    X,
    Loader2,
    ClipboardList,
    CalendarDays,
    PackageCheck,
    AlertTriangle,
    CheckCircle2,
    Eye,
} from "lucide-react";
import BASE_URL from "../../../config/api";
import ChallanModal from "../../challan/ChallanModal";

const MRQ_API = `${BASE_URL}/material-requisition`;
const PROJECT_API = `${BASE_URL}/project-master`;
const ITEM_API = `${BASE_URL}/item-identity`;

const authHeader = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

const emptyForm = {
    projectRef: "",
    requiredDate: "",
    priority: "NORMAL",
    purpose: "",
};

export default function CreateMRQModal({
    form,
    setForm,
    projects,
    selectedRows,
    updateRow,
    removeRow,
    onClose,
    onSave,
    saving,
    itemPickerOpen,
    setItemPickerOpen,
    itemSearch,
    setItemSearch,
    filteredItems,
    pickerSelectedItems,
    togglePickerItem,
    addSelectedItemsToMRQ,
}) {
    const update = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                            Material Requisition
                        </p>
                        <h2 className="text-xl font-bold text-white">Create MRQ</h2>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Project *
                            </label>
                            <select
                                name="projectRef"
                                value={form.projectRef}
                                onChange={update}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                            >
                                <option value="">Select Project</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.projectName || project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Required Date *"
                            name="requiredDate"
                            type="date"
                            value={form.requiredDate}
                            onChange={update}
                        />

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">
                                Priority
                            </label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={update}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                            >
                                <option value="NORMAL">NORMAL</option>
                                <option value="URGENT">URGENT</option>
                                <option value="CRITICAL">CRITICAL</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => setItemPickerOpen(true)}
                                className="w-full rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                            >
                                + Select Items
                            </button>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm text-slate-300">
                                Purpose
                            </label>
                            <textarea
                                name="purpose"
                                value={form.purpose}
                                onChange={update}
                                rows={2}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
                        <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
                            <p className="font-semibold text-white">
                                Required Items ({selectedRows.length})
                            </p>
                        </div>

                        {selectedRows.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                No items selected
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-sm">
                                    <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="p-3 text-left">Item</th>
                                            <th className="p-3 text-left">Code</th>
                                            <th className="p-3 text-left">Required Qty *</th>
                                            <th className="p-3 text-left">Remarks</th>
                                            <th className="p-3 text-center">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-800">
                                        {selectedRows.map((row, index) => (
                                            <tr key={row.itemRef}>
                                                <td className="p-3 font-semibold text-white">
                                                    {row.itemName}
                                                    <div className="text-xs text-slate-500">
                                                        {row.unit}
                                                    </div>
                                                </td>

                                                <td className="p-3 text-cyan-300">{row.itemCode}</td>

                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        value={row.requiredQty}
                                                        onChange={(e) =>
                                                            updateRow(index, "requiredQty", e.target.value)
                                                        }
                                                        className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500"
                                                    />
                                                </td>

                                                <td className="p-3">
                                                    <input
                                                        value={row.remarks}
                                                        onChange={(e) =>
                                                            updateRow(index, "remarks", e.target.value)
                                                        }
                                                        className="w-72 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500"
                                                    />
                                                </td>

                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => removeRow(index)}
                                                        className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                                                    >
                                                        <X size={17} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    >
                        {saving && <Loader2 size={18} className="animate-spin" />}
                        Save MRQ
                    </button>
                </div>
            </div>

            {itemPickerOpen && (
                <ItemPickerModal
                    itemSearch={itemSearch}
                    setItemSearch={setItemSearch}
                    filteredItems={filteredItems}
                    pickerSelectedItems={pickerSelectedItems}
                    togglePickerItem={togglePickerItem}
                    addSelectedItemsToMRQ={addSelectedItemsToMRQ}
                    onClose={() => setItemPickerOpen(false)}
                />
            )}
        </div>
    );
}

function Input({ label, name, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <input
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />
        </div>
    );
}

function ItemPickerModal({
    itemSearch,
    setItemSearch,
    filteredItems,
    pickerSelectedItems,
    togglePickerItem,
    addSelectedItemsToMRQ,
    onClose,
}) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
            <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Select Items</h3>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="border-b border-slate-800 p-4">
                    <input
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="Search item name, code, category..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {filteredItems.map((item) => {
                            const isSelected = pickerSelectedItems.some(
                                (x) => x._id === item._id
                            );

                            return (
                                <button
                                    key={item._id}
                                    onClick={() => togglePickerItem(item)}
                                    className={`rounded-2xl border p-4 text-left transition ${isSelected
                                        ? "border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-500/50"
                                        : "border-slate-800 bg-slate-900 hover:border-cyan-500/40"
                                        }`}
                                >
                                    <div className="flex justify-between gap-3">
                                        <div>
                                            <h4 className="font-semibold text-white">
                                                {item.itemName}
                                            </h4>
                                            <p className="mt-1 text-xs text-cyan-300">
                                                {item.itemCode} · {item.unit || "Nos"}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-500">
                                                {item.category || "-"}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <span className="h-fit rounded-full bg-cyan-400 px-2 py-1 text-xs font-bold text-slate-950">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800 px-6 py-4">
                    <p className="text-sm text-cyan-300">
                        {pickerSelectedItems.length} item(s) selected
                    </p>

                    <button
                        onClick={addSelectedItemsToMRQ}
                        className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                        Add Selected Items
                    </button>
                </div>
            </div>
        </div>
    );
}