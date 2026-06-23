import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import DPRSiteStockPickerModal from "./DPRSiteStockPickerModal";
export default function CreateDPRModal({
    form,
    setForm,
    projects,
    saving,
    onClose,
    onSave,
    mode = "add",
}) {
    const isView = mode === "view";
    const isEdit = mode === "edit";

    const [stockPickerOpen, setStockPickerOpen] = useState(false);

    const update = (e) => {
        if (isView) return;

        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const updateManpower = (index, field, value) => {
        if (isView) return;

        setForm((prev) => {
            const copy = [...prev.manpowerDetails];
            copy[index][field] = value;
            return { ...prev, manpowerDetails: copy };
        });
    };

    const addManpower = () => {
        setForm((prev) => ({
            ...prev,
            manpowerDetails: [...prev.manpowerDetails, { role: "", count: "" }],
        }));
    };

    const removeManpower = (index) => {
        setForm((prev) => ({
            ...prev,
            manpowerDetails: prev.manpowerDetails.filter((_, i) => i !== index),
        }));
    };

    const updateMaterial = (type, index, field, value) => {
        if (isView) return;

        setForm((prev) => {
            const copy = [...prev[type]];
            copy[index][field] = value;
            return { ...prev, [type]: copy };
        });
    };

    const addMaterial = (type) => {
        setForm((prev) => ({
            ...prev,
            [type]: [
                ...prev[type],
                {
                    itemName: "",
                    itemCode: "",
                    uom: "",
                    quantity: "",
                    source: "OTHER",
                    remarks: "",
                },
            ],
        }));
    };

    const removeMaterial = (type, index) => {
        setForm((prev) => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index),
        }));
    };

    const addPickedSiteStockItems = (pickedRows) => {
        setForm((prev) => ({
            ...prev,
            materialUsed: [...prev.materialUsed, ...pickedRows],
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase text-cyan-300">
                            Daily Progress Report
                        </p>
                        <h2 className="text-xl font-bold">
                            {isView ? "View DPR" : isEdit ? "Edit DPR" : "Create DPR"}
                        </h2>
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={22} />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <Section title="Basic Details">
                        <Select
                            label="Project *"
                            name="projectRef"
                            value={form.projectRef}
                            onChange={update}
                            disabled={isView}
                        >
                            <option value="">Select Project</option>
                            {projects.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.projectName || p.name}
                                </option>
                            ))}
                        </Select>

                        <Input
                            label="Report Date *"
                            name="reportDate"
                            type="date"
                            value={form.reportDate}
                            onChange={update}
                            readOnly={isView}
                        />

                        <Input
                            label="Site Incharge"
                            name="siteInchargeName"
                            value={form.siteInchargeName}
                            onChange={update}
                            readOnly={isView}
                        />

                        <Select
                            label="Weather"
                            name="weather"
                            value={form.weather}
                            onChange={update}
                            disabled={isView}
                        >
                            <option value="CLEAR">Clear</option>
                            <option value="CLOUDY">Cloudy</option>
                            <option value="RAINY">Rainy</option>
                            <option value="HOT">Hot</option>
                            <option value="OTHER">Other</option>
                        </Select>
                    </Section>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Work Done Today *
                        </label>
                        <textarea
                            name="workDoneToday"
                            value={form.workDoneToday}
                            onChange={update}
                            readOnly={isView}
                            rows={4}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />
                    </div>

                    <ArraySection
                        title="Manpower Details"
                        onAdd={addManpower}
                        hideAdd={isView}
                    >
                        {form.manpowerDetails.map((row, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_160px_50px]"
                            >
                                <Input
                                    label="Role"
                                    value={row.role}
                                    onChange={(e) =>
                                        updateManpower(index, "role", e.target.value)
                                    }
                                    readOnly={isView}
                                />

                                <Input
                                    label="Count"
                                    type="number"
                                    value={row.count}
                                    onChange={(e) =>
                                        updateManpower(index, "count", e.target.value)
                                    }
                                    readOnly={isView}
                                />

                                {!isView && (
                                    <button
                                        onClick={() => removeManpower(index)}
                                        className="mt-7 rounded-xl bg-red-500/10 p-3 text-red-300"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </ArraySection>

                    <MaterialSection
                        title="Material Received"
                        type="materialReceived"
                        rows={form.materialReceived}
                        isView={isView}
                        onAdd={addMaterial}
                        onRemove={removeMaterial}
                        onUpdate={updateMaterial}
                    />

                    <MaterialSection
                        title="Material Used"
                        type="materialUsed"
                        rows={form.materialUsed}
                        isView={isView}
                        onAdd={() => {
                            if (!form.projectRef) {
                                return alert("Select project first");
                            }
                            setStockPickerOpen(true);
                        }}
                        onRemove={removeMaterial}
                        onUpdate={updateMaterial}
                        addLabel="Pick From Site Stock"
                    />

                    <Section title="Other Details">
                        <Input
                            label="Visitors"
                            name="visitors"
                            value={form.visitors}
                            onChange={update}
                            readOnly={isView}
                        />

                        <Select
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={update}
                            disabled={isView}
                        >
                            <option value="DRAFT">Draft</option>
                            <option value="SUBMITTED">Submitted</option>
                        </Select>
                    </Section>

                    <div>
                        <label className="mb-2 block text-sm text-slate-300">Remarks</label>
                        <textarea
                            name="remarks"
                            value={form.remarks}
                            onChange={update}
                            readOnly={isView}
                            rows={2}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-slate-300"
                    >
                        Close
                    </button>

                    {!isView && (
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEdit ? "Update DPR" : "Create DPR"}
                        </button>
                    )}
                </div>
            </div>
            {stockPickerOpen && (
  <DPRSiteStockPickerModal
    projectRef={form.projectRef}
    onClose={() => setStockPickerOpen(false)}
    onSelect={addPickedSiteStockItems}
  />
)}
        </div>
    );
}

function MaterialSection({
    title,
    type,
    rows,
    isView,
    onAdd,
    onRemove,
    onUpdate,
    addLabel = "Add",
}) {
    return (
        <ArraySection title={title}
        onAdd={() => onAdd(type)} 
        hideAdd={isView}
        addLabel={addLabel}
        >
            {rows.map((row, index) => (
                <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-6"
                >
                    <Input
                        label="Item Name"
                        value={row.itemName}
                        onChange={(e) => onUpdate(type, index, "itemName", e.target.value)}
                        readOnly={isView}
                    />

                    <Input
                        label="Item Code"
                        value={row.itemCode}
                        onChange={(e) => onUpdate(type, index, "itemCode", e.target.value)}
                        readOnly={isView}
                    />

                    <Input
                        label="UOM"
                        value={row.uom}
                        onChange={(e) => onUpdate(type, index, "uom", e.target.value)}
                        readOnly={isView}
                    />

                    <Input
                        label="Qty"
                        type="number"
                        value={row.quantity}
                        onChange={(e) => onUpdate(type, index, "quantity", e.target.value)}
                        readOnly={isView}
                    />

                    <Select
                        label="Source"
                        value={row.source}
                        onChange={(e) => onUpdate(type, index, "source", e.target.value)}
                        disabled={isView}
                    >
                        <option value="MAIN_STORE">Main Store</option>
                        <option value="LOCAL_PURCHASE">Local Purchase</option>
                        <option value="SITE_TRANSFER">Site Transfer</option>
                        <option value="OTHER">Other</option>
                    </Select>

                    {!isView && (
                        <button
                            onClick={() => onRemove(type, index)}
                            className="mt-7 rounded-xl bg-red-500/10 p-3 text-red-300"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            ))}
        </ArraySection>
    );
}

function Section({ title, children }) {
    return (
        <div>
            <h3 className="mb-3 text-sm font-semibold text-cyan-300">{title}</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {children}
            </div>
        </div>
    );
}

function ArraySection({ title, children, onAdd, hideAdd, addLabel = "Add" }) {
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-cyan-300">{title}</h3>

                {!hideAdd && (
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300"
                    >
                        <Plus size={16} />
                       {addLabel}
                    </button>
                )}
            </div>

            <div className="space-y-3">{children}</div>
        </div>
    );
}

function Input({
    label,
    name,
    value,
    onChange,
    type = "text",
    readOnly = false,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <input
                name={name}
                value={value || ""}
                type={type}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500 ${readOnly ? "cursor-not-allowed opacity-70" : ""
                    }`}
            />
        </div>
    );
}

function Select({
    label,
    name,
    value,
    onChange,
    disabled = false,
    children,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <select
                name={name}
                value={value || ""}
                onChange={onChange}
                disabled={disabled}
                className={`w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500 ${disabled ? "cursor-not-allowed opacity-70" : ""
                    }`}
            >
                {children}
            </select>
        </div>
    );
}