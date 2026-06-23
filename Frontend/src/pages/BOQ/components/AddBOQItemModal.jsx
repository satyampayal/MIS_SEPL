import React from "react";

export default function AddBOQItemModal({
    form,
    setForm,
    saving,
    onClose,
    onSave,
    mode = "add",
}) {

    const isView = mode === "view";
    const isEdit = mode === "edit";
    const update = (e) => {
        if (isView) return;
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const poQty = Number(form.poQty || 0);
    const supplyRate = Number(form.supplyRate || 0);
    const installationRate = Number(form.installationRate || 0);
    const contractorRate = Number(form.contractorInstallationRate || 0);

    const supplyAmount = poQty * supplyRate;
    const installationAmount = poQty * installationRate;
    const contractorAmount = poQty * contractorRate;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase text-cyan-300">
                            BOQ Item
                        </p>
                        <h2 className="text-xl font-bold">
                            {isView ? "View BOQ Item" : isEdit ? "Edit BOQ Item" : "Add BOQ Item"}
                        </h2>
                    </div>

                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    <FieldInput
                        label="BOQ Item Code"
                        name="boqItemCode"
                        value={form.boqItemCode}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="BOQ Sr No"
                        name="boqSrNo"
                        value={form.boqSrNo}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="Activity *"
                        name="activity"
                        value={form.activity}
                        onChange={update}
                        placeholder="Cable Tray Installation"
                        readOnly={isView}
                    />

                    <FieldInput
                        label="General Name"
                        name="generalName"
                        value={form.generalName}
                        onChange={update}
                        placeholder="Cable Tray"
                        readOnly={isView}
                    />

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm text-slate-300">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={update}
                            rows={2}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
                            readOnly={isView}
                        />
                    </div>

                    <FieldInput
                        label="UOM"
                        name="uom"
                        value={form.uom}
                        onChange={update}
                        placeholder="Mtr / Nos / Job"
                        readOnly={isView}
                    />

                    <FieldInput
                        label="PO Qty *"
                        name="poQty"
                        type="number"
                        value={form.poQty}
                        onChange={update}
                        readOnly={isView}
                    />
                    <FieldInput
                        label="Supply Rate"
                        name="supplyRate"
                        type="number"
                        value={form.supplyRate}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="Installation Rate"
                        name="installationRate"
                        type="number"
                        value={form.installationRate}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="Contractor Installation Rate"
                        name="contractorInstallationRate"
                        type="number"
                        value={form.contractorInstallationRate}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="Category"
                        name="category"
                        value={form.category}
                        onChange={update}
                        readOnly={isView}
                    />

                    <FieldInput
                        label="Sub Category"
                        name="subCategory"
                        value={form.subCategory}
                        onChange={update}
                        readOnly={isView}
                    />

                    <div className="md:col-span-2">
                        <FieldInput
                            label="Aliases / Site Words"
                            name="aliasesText"
                            value={form.aliasesText}
                            onChange={update}
                            placeholder="tray fitting, cable tray work, tray fixing"
                            readOnly={isView}
                        />
                    </div>

                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 md:col-span-2">
                        <p className="text-sm text-slate-400">Calculation Preview</p>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <PreviewBox label="BOQ Qty" value={poQty} />
                            <PreviewBox
                                label="Supply Amount"
                                value={`₹${supplyAmount.toLocaleString("en-IN")}`}
                            />
                            <PreviewBox
                                label="Installation Amount"
                                value={`₹${installationAmount.toLocaleString("en-IN")}`}
                            />
                            <PreviewBox
                                label="Contractor Amount"
                                value={`₹${contractorAmount.toLocaleString("en-IN")}`}
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
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
                        Cancel
                    </button>
                    {!isView && (
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function FieldInput({
    label,
    name,
    value,
    onChange,
    type = "text",
    placeholder = "",
    readOnly = false,
}) {
    return (
        <div>
            <label className="mb-2 block text-sm text-slate-300">{label}</label>
            <input
                name={name}
                value={value}
                type={type}
                placeholder={placeholder}
                onChange={onChange}
                className={`w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500
                     ${readOnly ?
                        "cursor-not-allowed opacity-70"
                        : ""
                    }`}
            />
        </div>
    );
}

function PreviewBox({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-bold text-white">{value}</p>
        </div>
    );
}   