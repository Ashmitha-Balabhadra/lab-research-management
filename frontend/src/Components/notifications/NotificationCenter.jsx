/**
 * NotificationCenter.jsx
 * ------------------------------------------------------------------
 * M3 Task 6 — Notifications Module for LabFlow Pro.
 *
 * Provides:
 * 1. Maintenance due & equipment status alerts
 * 2. Calibration & certification expiry notifications
 * 3. Booking confirmation & upcoming reminder notifications
 * 4. Waitlist availability notifications
 * 5. Idle / underutilized equipment alerts
 * 6. Inter-institution sharing request & approval alerts
 * 7. Category filters, unread badge counter, search, mark read, mark all read
 * ------------------------------------------------------------------
 */

import { useState, useMemo, useEffect } from "react";
import {
  Bell, CheckCircle2, Wrench, Thermometer, CalendarClock, Clock,
  Gauge, Share2, AlertTriangle, Search, CheckCheck, Filter, ShieldAlert,
  ChevronRight, Building2, UserX,
} from "lucide-react";
import { ViewHeader, StatusBadge, EmptyState } from "../shared/ui.jsx";
import { notificationApi } from "../../api/notificationApi.js";

// Role-specific rich notifications fallback dataset
const RICH_NOTIFICATIONS_BY_ROLE = {
  researcher: [
    {
      id: "N-101",
      category: "BOOKING",
      priority: "HIGH",
      title: "Booking BK-2209 Confirmed",
      message: "Your session on Confocal Microscope Alpha for Aug 18, 10:00 AM is confirmed.",
      resource: "Confocal Microscope Alpha",
      time: "10 mins ago",
      read: false,
      actionLabel: "View Booking",
      actionTarget: "bookings",
    },
    {
      id: "N-102",
      category: "WAITLIST",
      priority: "MEDIUM",
      title: "Waitlist Spot Available!",
      message: "A slot opened up for Agilent 1260 HPLC System on Aug 19, 2:00 PM. Book now to secure.",
      resource: "Agilent 1260 HPLC System",
      time: "45 mins ago",
      read: false,
      actionLabel: "Book Equipment",
      actionTarget: "search",
    },
    {
      id: "N-103",
      category: "MAINTENANCE",
      priority: "HIGH",
      title: "Booked Resource Under Maintenance",
      message: "Zeiss Axio Observer is scheduled for calibration maintenance on Aug 20. Your booking may be rescheduled.",
      resource: "Zeiss Axio Observer",
      time: "2 hours ago",
      read: false,
      actionLabel: "Check Status",
      actionTarget: "bookings",
    },
    {
      id: "N-104",
      category: "CALIBRATION",
      priority: "MEDIUM",
      title: "Certification Expiry Warning",
      message: "Safety certification for Biosafety Cabinet Hood-3 expires in 5 days.",
      resource: "Biosafety Cabinet Hood-3",
      time: "1 day ago",
      read: true,
      actionLabel: "View Details",
      actionTarget: "search",
    },
  ],

  technician: [
    {
      id: "N-201",
      category: "MAINTENANCE",
      priority: "CRITICAL",
      title: "Maintenance Work Order Assigned: MR-2026-00045",
      message: "QuantStudio 7 qPCR — Thermal block alignment failure. Assigned to you.",
      resource: "QuantStudio 7 qPCR",
      time: "15 mins ago",
      read: false,
      actionLabel: "Open Work Order",
      actionTarget: "workorders",
    },
    {
      id: "N-202",
      category: "CALIBRATION",
      priority: "HIGH",
      title: "Calibration Overdue: NMR Spectrometer 600MHz",
      message: "Annual magnet calibration certificate expired 3 days ago. Maintenance required.",
      resource: "NMR Spectrometer 600MHz",
      time: "2 hours ago",
      read: false,
      actionLabel: "Log Calibration",
      actionTarget: "calibration",
    },
    {
      id: "N-203",
      category: "MAINTENANCE",
      priority: "MEDIUM",
      title: "Preventative Maintenance Due",
      message: "Beckman Centrifuge XPN-100 routine 500-hour rotor check is due this week.",
      resource: "Beckman Centrifuge XPN-100",
      time: "1 day ago",
      read: true,
      actionLabel: "View Schedule",
      actionTarget: "maintenance",
    },
  ],

  manager: [
    {
      id: "N-301",
      category: "SHARING",
      priority: "HIGH",
      title: "Inter-Institution Sharing Request Received",
      message: "Northbridge University requested access to Agilent 1260 HPLC System for Aug 25–29.",
      resource: "Agilent 1260 HPLC System",
      time: "30 mins ago",
      read: false,
      actionLabel: "Review Sharing Request",
      actionTarget: "sharing",
    },
    {
      id: "N-302",
      category: "IDLE",
      priority: "MEDIUM",
      title: "Idle Equipment Alert: Thermal Cycler Pro",
      message: "Thermal Cycler Pro utilization dropped below 20% this month (14 hrs used). Candidate for inter-lab sharing.",
      resource: "Thermal Cycler Pro",
      time: "3 hours ago",
      read: false,
      actionLabel: "View Utilization",
      actionTarget: "utilization",
    },
    {
      id: "N-303",
      category: "MAINTENANCE",
      priority: "CRITICAL",
      title: "Critical Issue Reported: SEM Microscope",
      message: "MR-2026-00042 vacuum pump failure logged. Equipment set to Under Maintenance.",
      resource: "SEM Microscope",
      time: "5 hours ago",
      read: false,
      actionLabel: "Oversight View",
      actionTarget: "maintenance",
    },
    {
      id: "N-304",
      category: "CALIBRATION",
      priority: "HIGH",
      title: "Calibration Due Soon (2 Equipment Units)",
      message: "Malvern Zetasizer Nano & HPLC System calibrations due within 10 days.",
      resource: "Multiple Equipment",
      time: "1 day ago",
      read: true,
      actionLabel: "Calibration Oversight",
      actionTarget: "calibration",
    },
  ],

  "department-head": [
    {
      id: "N-401",
      category: "SHARING",
      priority: "HIGH",
      title: "Department Sharing Agreement Pending Approval",
      message: "Agreement SR-301 with Coastal Research Institute requires Department Head authorization.",
      resource: "HPLC System",
      time: "1 hour ago",
      read: false,
      actionLabel: "Authorize Agreement",
      actionTarget: "sharing",
    },
    {
      id: "N-402",
      category: "IDLE",
      priority: "MEDIUM",
      title: "Departmental Resource Underutilization",
      message: "Physics & Optics lab equipment overall utilization sits at 58% (target 75%).",
      resource: "Physics & Optics Lab",
      time: "4 hours ago",
      read: false,
      actionLabel: "View Analytics",
      actionTarget: "analytics",
    },
    {
      id: "N-403",
      category: "MAINTENANCE",
      priority: "HIGH",
      title: "Department Downtime Warning",
      message: "Total equipment downtime in Biochemistry reached 38 hours this month.",
      resource: "Biochemistry Dept",
      time: "1 day ago",
      read: true,
      actionLabel: "View Cost Impact",
      actionTarget: "budget",
    },
  ],

  "institution-admin": [
    {
      id: "N-501",
      category: "SHARING",
      priority: "HIGH",
      title: "Cross-Institution Invoicing Action Needed",
      message: "Invoice INV-2026-083 to Coastal Research Institute is overdue (₹9,600).",
      resource: "Inter-Institution Invoicing",
      time: "2 hours ago",
      read: false,
      actionLabel: "View Invoicing",
      actionTarget: "billing",
    },
    {
      id: "N-502",
      category: "IDLE",
      priority: "MEDIUM",
      title: "Institution Capacity Optimization Indicator",
      message: "6 equipment units across 3 departments identified as sharing candidates.",
      resource: "Institution-wide Assets",
      time: "6 hours ago",
      read: false,
      actionLabel: "View Analytics",
      actionTarget: "analytics",
    },
    {
      id: "N-503",
      category: "CALIBRATION",
      priority: "HIGH",
      title: "Institution Compliance Snapshot",
      message: "91% of institution equipment certified. 4 units overdue for annual inspection.",
      resource: "Institution Compliance",
      time: "1 day ago",
      read: true,
      actionLabel: "Export Report",
      actionTarget: "reports",
    },
  ],
};

export default function NotificationCenter({
  role = "manager",
  user,
  notifications = [],
  setNotifications,
  onNavigate,
  toast,
}) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize notifications list from props or role-specific seed
  const items = useMemo(() => {
    if (notifications && notifications.length > 0) return notifications;
    return RICH_NOTIFICATIONS_BY_ROLE[role] || RICH_NOTIFICATIONS_BY_ROLE.manager;
  }, [notifications, role]);

  const [localList, setLocalList] = useState(items);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setLocalList(notifications);
    }
  }, [notifications]);

  // Attempt real API sync on mount (graceful fallback if offline)
  useEffect(() => {
    async function syncApi() {
      try {
        setLoading(true);
        const data = await notificationApi.list();
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((n) => ({
            id: String(n.notificationId || n.id),
            category: n.type || "BOOKING",
            priority: "MEDIUM",
            title: n.title,
            message: n.message,
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently",
            read: Boolean(n.isRead),
          }));
          setLocalList(mapped);
          if (setNotifications) setNotifications(mapped);
        }
      } catch (err) {
        // Backend API offline — keep structured demo notification state
      } finally {
        setLoading(false);
      }
    }
    syncApi();
  }, [setNotifications]);

  // Filter categories list
  const FILTER_TABS = [
    { id: "ALL", label: "All Notifications" },
    { id: "UNREAD", label: "Unread Only" },
    { id: "MAINTENANCE", label: "Maintenance Due" },
    { id: "CALIBRATION", label: "Calibration & Certification" },
    { id: "BOOKING", label: "Booking Updates" },
    { id: "WAITLIST", label: "Waitlist Availability" },
    { id: "IDLE", label: "Idle Equipment" },
    { id: "SHARING", label: "Sharing Requests" },
  ];

  // Derived filtered notification items
  const filteredItems = useMemo(() => {
    return localList.filter((item) => {
      // Category filter
      if (activeFilter === "UNREAD" && item.read) return false;
      if (activeFilter !== "ALL" && activeFilter !== "UNREAD" && item.category !== activeFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchMessage = (item.message || "").toLowerCase().includes(q);
        const matchResource = (item.resource || "").toLowerCase().includes(q);
        if (!matchTitle && !matchMessage && !matchResource) return false;
      }

      return true;
    });
  }, [localList, activeFilter, searchQuery]);

  const unreadCount = useMemo(() => localList.filter((n) => !n.read).length, [localList]);

  // Handlers
  const handleMarkRead = async (id) => {
    const updated = localList.map((n) => (n.id === id ? { ...n, read: true } : n));
    setLocalList(updated);
    if (setNotifications) setNotifications(updated);
    toast?.("Notification marked as read.", "info");

    try {
      if (Number(id)) await notificationApi.markRead(id);
    } catch (e) {
      // ignore offline
    }
  };

  const handleMarkAllRead = async () => {
    const updated = localList.map((n) => ({ ...n, read: true }));
    setLocalList(updated);
    if (setNotifications) setNotifications(updated);
    toast?.("All notifications marked as read.", "success");

    try {
      await notificationApi.markRead("read-all");
    } catch (e) {
      // ignore offline
    }
  };

  const handleAction = (item) => {
    handleMarkRead(item.id);
    if (item.actionTarget && onNavigate) {
      onNavigate(item.actionTarget);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "MAINTENANCE": return Wrench;
      case "CALIBRATION": return Thermometer;
      case "BOOKING": return CalendarClock;
      case "WAITLIST": return Clock;
      case "IDLE": return Gauge;
      case "SHARING": return Share2;
      default: return Bell;
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-50 text-red-700 border-red-200";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-200";
      case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-200";
      case "LOW": return "bg-slate-100 text-slate-600 border-slate-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Notifications Center"
        subtitle="Real-time alerts for maintenance due dates, calibration expirations, booking status updates, waitlist slots, idle equipment, and inter-institution sharing."
        action={
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className={`rounded-lg border px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                unreadCount > 0
                  ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  : "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
              }`}
            >
              <CheckCheck size={14} className="text-blue-600" /> Mark All as Read
            </button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              activeFilter === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search notification messages, equipment names, or work orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12 text-xs font-semibold text-slate-500">
          Loading notifications...
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          subtitle={searchQuery ? "No notifications match your search query." : "You're all caught up with alerts in this category."}
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4.5 transition-all ${
                  item.read
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/50 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.read ? "bg-slate-100 text-slate-500" : "bg-blue-600 text-white"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm ${item.read ? "font-bold text-slate-800" : "font-extrabold text-slate-900"}`}>
                          {item.title}
                        </p>
                        {!item.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                        {item.priority && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(item.priority)}`}>
                            {item.priority}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        {item.resource && (
                          <span className="font-semibold text-slate-500">{item.resource}</span>
                        )}
                        <span>·</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.actionLabel && (
                      <button
                        onClick={() => handleAction(item)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-1 transition-colors"
                      >
                        {item.actionLabel} <ChevronRight size={13} />
                      </button>
                    )}
                    {!item.read && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        className="rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1.5 transition-colors"
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
