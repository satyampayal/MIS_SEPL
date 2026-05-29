import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  PackageSearch,
  Truck,
  MapPin,
  ArrowRight,
} from "lucide-react";

const reportCards = [
  {
    title: "Material Summary",
    desc: "Top vendors, top materials, active sites, and challan type summary.",
    icon: BarChart3,
    path: "/reports/material-summary",
  },
  {
    title: "Project-wise Material Report",
    desc: "Check material usage, vendors, and challan flow project by project.",
    icon: Building2,
    path: "/reports/material-history/projects",
  },
  {
    title: "Material-wise History",
    desc: "Track one material across projects, sites, vendors, and challans.",
    icon: PackageSearch,
    path: "/material-movement/history",
  },
  {
    title: "Head Store live stock ",
    desc: "See which material are availbale and supplied .",
    icon: Truck,
    path: "/reports/material-history/head-store-stock",
  },
  {
    title: "Project live stock  Report",
    desc: "Analyze material received and used stores.",
    icon: MapPin,
    path: "/reports/material-history/project-stock",
  },
   {
    title: "Project Material Planning Center",
    desc: "Analyze Material Planning for each project.",
    icon: Building2,
    path: "/project-material-planning",
  },
];

export default function MaterialAnalyticsCenter() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-8">
        <p className="text-sm text-blue-400 font-semibold">Reports</p>
        <h1 className="text-3xl font-bold mt-1">Material Analytics Center</h1>
        <p className="text-slate-400 mt-2 max-w-3xl">
          One control room for complete material movement analysis — summary,
          project-wise, material-wise, vendor-wise and site-wise reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition"
            >
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Icon className="text-blue-400" size={26} />
                </div>

                <ArrowRight
                  className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition"
                  size={22}
                />
              </div>

              <h2 className="text-xl font-semibold mt-5">{card.title}</h2>
              <p className="text-slate-400 text-sm mt-2 leading-6">
                {card.desc}
              </p>

              <button className="mt-5 text-sm font-medium text-blue-400">
                Open Report →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}