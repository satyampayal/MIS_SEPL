import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import BASE_URL from "../../config/api";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState({
    taxSummary: null,
    monthlyTrend: [],
    deliveryStatus: [],
    vendorAnalysis: [],
    projectAnalysis: [],
  });

  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchDashboardAnalytics = async (force = false) => {
    try {
      if (!force && lastFetch && Date.now() - lastFetch < 5 * 60 * 1000) {
        return;
      }

      setLoading(true);

      const token = localStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [summary, monthly, delivery, vendor, project] =
        await Promise.allSettled([
          axios.get(`${BASE_URL}/analytics/tax-invoice/summary`, { headers }),
          axios.get(`${BASE_URL}/analytics/tax-invoice/monthly-trend`, { headers }),
          axios.get(`${BASE_URL}/analytics/tax-invoice/delivery-status`, { headers }),
          axios.get(`${BASE_URL}/analytics/tax-invoice/vendor-analysis`, { headers }),
          axios.get(`${BASE_URL}/analytics/tax-invoice/project-analysis`, { headers }),
        ]);

      setDashboardData({
        taxSummary: summary.status === "fulfilled" ? summary.value.data.data : null,
        monthlyTrend: monthly.status === "fulfilled" ? monthly.value.data.data : [],
        deliveryStatus: delivery.status === "fulfilled" ? delivery.value.data.data : [],
        vendorAnalysis: vendor.status === "fulfilled" ? vendor.value.data.data : [],
        projectAnalysis: project.status === "fulfilled" ? project.value.data.data : [],
      });

      setLastFetch(Date.now());
    } catch (error) {
      console.log("Dashboard analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboardData,
        loading,
        fetchDashboardAnalytics,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}