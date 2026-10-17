
import React, { useMemo } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    CalendarDays,
    Clock3,
    IndianRupee,
    ListChecks,
    TrendingDown,
    Zap,
} from "lucide-react";

const number = (value) => Number(value || 0);

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(number(value));

const qty = (value) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(number(value));

const itemId = (item) =>
    String(
        item?.boqItemRef?._id ||
        item?.boqItemRef ||
        item?._id ||
        ""
    );

const itemName = (item) =>
    item?.description ||
    item?.activity ||
    item?.boqItemRef?.activity ||
    item?.boqItemRef?.description ||
    item?.boqItemRef?.boqItemCode ||
    "BOQ Item";

const getEntries = (item) =>
    (item?.dailyBreakup || []).flatMap((day) =>
        (day?.entries || []).map((entry) => ({
            ...entry,
            _reportDate:
                entry.measurementDate || day.date || day._id,
        }))
    );

const getActualQty = (item) => {
    const entries = getEntries(item).filter(
        (entry) =>
            entry.executedByType === "SEPL" &&
            entry.approvalStatus === "APPROVED"
    );

    if (entries.length) {
        return entries.reduce(
            (sum, entry) => sum + number(entry.todayQty),
            0
        );
    }

    // Fallback to the report's existing SEPL quantity.
    return number(item.seplQty);
};

const getRate = (item) =>
    number(
        item.rate ??
        item.installationRate ??
        item.boqItemRef?.installationRate ??
        item.boqItemRef?.contractorInstallationRate
    );

function MetricCard({ title, value, note, icon: Icon, tone = "cyan" }) {
    const tones = {
        cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
        green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        red: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <p className="mt-3 break-words text-2xl font-bold text-white">
                        {value}
                    </p>
                    {note && (
                        <p className="mt-2 text-xs text-slate-500">{note}</p>
                    )}
                </div>
                <div className={`rounded-xl border p-2 ${tones[tone]}`}>
                    <Icon size={19} />
                </div>
            </div>
        </div>
    );
}

function ItemTable({ title, description, items, tone, emptyText }) {
    const styles = {
        red: "text-rose-300 bg-rose-500/10",
        amber: "text-amber-300 bg-amber-500/10",
        blue: "text-blue-300 bg-blue-500/10",
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 p-4">
                <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[tone]}`}>
                    {items.length} item(s)
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3">BOQ Item</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3 text-right">Target Qty</th>
                            <th className="px-4 py-3 text-right">Executed Qty</th>
                            <th className="px-4 py-3 text-right">Pending Qty</th>
                            <th className="px-4 py-3 text-right">Target Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr
                                key={`${itemId(item)}-${index}`}
                                className="border-t border-slate-800"
                            >
                                <td className="max-w-[300px] whitespace-normal px-4 py-3">
                                    <p className="font-medium text-slate-200">
                                        {itemName(item)}
                                    </p>
                                    {item.lastExecutionDate && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            Last execution: {item.lastExecutionDate}
                                        </p>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-400">
                                    {item.unit || "—"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {qty(item.plannedQty)}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-300">
                                    {qty(item.actualQty)}
                                </td>
                                <td className="px-4 py-3 text-right text-amber-300">
                                    {qty(Math.max(0, item.plannedQty - item.actualQty))}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {money(item.plannedValue)}
                                </td>
                            </tr>
                        ))}
                        {!items.length && (
                            <tr>
                                <td colSpan={6} className="p-7 text-center text-slate-500">
                                    {emptyText}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function WorkPlanExecutiveSummary({
    report,
    reportMonth,
    project,
}) {
    const analysis = useMemo(() => {
        const reportItems = report?.items || [];

        // Combine duplicate BOQ rows before determining idle/partial status.
        const grouped = new Map();

        for (const item of reportItems) {
            const id = itemId(item);
            if (!id) continue;

            const plannedQty = number(item.plannedQty);
            const actualQty = getActualQty(item);
            const rate = getRate(item);

            if (!grouped.has(id)) {
                grouped.set(id, {
                    ...item,
                    plannedQty: 0,
                    actualQty: 0,
                    rate,
                    lastExecutionDate: null,
                });
            }

            const current = grouped.get(id);
            current.plannedQty += plannedQty;
            current.actualQty += actualQty;

            if (!current.rate && rate) current.rate = rate;

            for (const entry of getEntries(item)) {
                if (
                    entry.executedByType === "SEPL" &&
                    entry.approvalStatus === "APPROVED" &&
                    number(entry.todayQty) > 0
                ) {
                    const date = entry._reportDate
                        ? new Date(entry._reportDate)
                        : null;

                    if (
                        date &&
                        !Number.isNaN(date.getTime()) &&
                        (!current.lastExecutionDate ||
                            date > new Date(current.lastExecutionDate))
                    ) {
                        current.lastExecutionDate = date.toISOString().slice(0, 10);
                    }
                }
            }
        }

        const allItems = [...grouped.values()].map((item) => ({
            ...item,
            pendingQty: Math.max(0, item.plannedQty - item.actualQty),
            plannedValue: item.plannedQty * item.rate,
            actualValue: item.actualQty * item.rate,
        }));

        const plannedItems = allItems.filter((item) => item.plannedQty > 0);
        const idleItems = plannedItems.filter((item) => item.actualQty <= 0);
        const partialItems = plannedItems.filter(
            (item) => item.actualQty > 0 && item.pendingQty > 0
        );
        const completedItems = plannedItems.filter(
            (item) => item.actualQty >= item.plannedQty
        );

        const plannedValue = plannedItems.reduce(
            (sum, item) => sum + item.plannedValue,
            0
        );
        const actualValue = plannedItems.reduce(
            (sum, item) => sum + item.actualValue,
            0
        );

        // Include only entries explicitly exposed by the API outside the
        // plan-item groups. Never infer unplanned work from missing data.
        const planIds = new Set(allItems.map(itemId));
        const standaloneEntries =
            report?.mbEntries ||
            report?.measurementEntries ||
            report?.entries ||
            [];

        const unplannedMap = new Map();

        for (const entry of standaloneEntries) {
            if (
                entry.executedByType !== "SEPL" ||
                entry.approvalStatus !== "APPROVED" ||
                number(entry.todayQty) <= 0
            ) {
                continue;
            }

            const id = itemId(entry);
            if (!id || planIds.has(id)) continue;

            if (!unplannedMap.has(id)) {
                unplannedMap.set(id, {
                    ...entry,
                    plannedQty: 0,
                    actualQty: 0,
                    rate: number(entry.rate),
                });
            }

            const row = unplannedMap.get(id);
            row.actualQty += number(entry.todayQty);
            if (!row.rate) row.rate = number(entry.rate);
        }

        const unplannedItems = [...unplannedMap.values()].map((item) => ({
            ...item,
            plannedValue: 0,
        }));

        const totalPlanned = number(report?.totals?.plannedValue) || plannedValue;
        const totalActual = number(report?.totals?.seplValue) ||
            number(report?.totals?.seplAmount) ||
            allItems.reduce((sum, item) => sum + item.actualValue, 0);

        return {
            allItems,
            plannedItems,
            idleItems,
            partialItems,
            completedItems,
            unplannedItems,
            plannedValue: totalPlanned,
            actualValue: totalActual,
            valueShortfall: Math.max(0, totalPlanned - totalActual),
            idleValue: idleItems.reduce(
                (sum, item) => sum + item.plannedValue,
                0
            ),
            partialValue: partialItems.reduce(
                (sum, item) => sum + item.plannedValue,
                0
            ),
        };
    }, [report]);

    if (!report) return null;

    const elapsed = (() => {
        if (!reportMonth) return null;

        const [year, month] = reportMonth.split("-").map(Number);
        const today = new Date();
        const isCurrentMonth =
            today.getFullYear() === year && today.getMonth() + 1 === month;

        const daysInMonth = new Date(year, month, 0).getDate();
        const elapsedDays = isCurrentMonth
            ? today.getDate()
            : today > new Date(year, month, 0)
                ? daysInMonth
                : 0;

        return {
            elapsedDays,
            daysInMonth,
            percent: daysInMonth
                ? Math.round((elapsedDays / daysInMonth) * 100)
                : 0,
        };
    })();

    const actualPercent = analysis.plannedValue > 0
        ? (analysis.actualValue / analysis.plannedValue) * 100
        : 0;

    return (
        <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                            Executive Summary
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-white">
                            Erection Progress & Idle Work
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            {project?.projectName || project?.name || "Project"}{" "}
                            · {reportMonth || "Selected month"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
                        <p className="text-xs text-slate-500">Monthly plan achievement</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                            {actualPercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={IndianRupee}
                        title="Planned Erection Value"
                        value={money(analysis.plannedValue)}
                        note="Value of planned items"
                        tone="blue"
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        title="Actual SEPL Erection Value"
                        value={money(analysis.actualValue)}
                        note="Approved SEPL MB execution"
                        tone="green"
                    />
                    <MetricCard
                        icon={TrendingDown}
                        title="Value Shortfall"
                        value={money(analysis.valueShortfall)}
                        note="Against the monthly planned value"
                        tone="amber"
                    />
                    <MetricCard
                        icon={AlertTriangle}
                        title="Idle Planned Items"
                        value={analysis.idleItems.length}
                        note={`${money(analysis.idleValue)} planned value untouched`}
                        tone={analysis.idleItems.length ? "red" : "green"}
                    />
                </div>

                <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={Clock3}
                        title="Partially Executed"
                        value={analysis.partialItems.length}
                        note={`${money(analysis.partialValue)} planned value across these items`}
                        tone="amber"
                    />
                    <MetricCard
                        icon={ListChecks}
                        title="Fully Achieved / Target Met"
                        value={analysis.completedItems.length}
                        note="Planned items at or above target quantity"
                        tone="green"
                    />
                    <MetricCard
                        icon={Zap}
                        title="Unplanned SEPL Items"
                        value={analysis.unplannedItems.length}
                        note="Requires MB entries for items outside the plan"
                        tone="blue"
                    />
                    <MetricCard
                        icon={CalendarDays}
                        title="Time Elapsed"
                        value={elapsed ? `${elapsed.percent}%` : "—"}
                        note={
                            elapsed
                                ? `${elapsed.elapsedDays} of ${elapsed.daysInMonth} calendar days`
                                : "Select a reporting month"
                        }
                        tone="cyan"
                    />
                </div>
            </section>

            <ItemTable
                title="Idle Planned Items — Not Executed"
                description="Planned quantity exists, but no approved SEPL execution is recorded in this report."
                items={analysis.idleItems}
                tone="red"
                emptyText="No untouched planned items found."
            />

            <ItemTable
                title="Partially Executed Planned Items"
                description="Execution has started, but the planned quantity is not yet achieved."
                items={analysis.partialItems}
                tone="amber"
                emptyText="No partially executed planned items found."
            />

            <ItemTable
                title="Unplanned SEPL Execution"
                description="Items executed in approved MB entries but absent from the Work Plan."
                items={analysis.unplannedItems}
                tone="blue"
                emptyText="No standalone unplanned MB entries were provided by the report API."
            />
        </div>
    );
}
