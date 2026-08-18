import { Microscope, Wrench, BarChart3, Building2, Landmark, Settings } from "lucide-react";

export const ROLES = [
  {
    id: "researcher",
    label: "Researcher / Student",
    desc: "Search equipment and manage bookings.",
    icon: Microscope,
    flow: "register-researcher",
  },
  {
    id: "technician",
    label: "Lab Technician",
    desc: "Manage work orders and maintenance.",
    icon: Wrench,
    flow: "login",
  },
  {
    id: "manager",
    label: "Lab Manager",
    desc: "Manage equipment and utilization.",
    icon: BarChart3,
    flow: "login",
  },
  {
    id: "department-head",
    label: "Department Head",
    desc: "Analyze department data.",
    icon: Building2,
    flow: "register",
  },
  {
    id: "institution-admin",
    label: "Institution Administrator",
    desc: "Manage resources and users.",
    icon: Landmark,
    flow: "register-admin",
  },
  {
    id: "system-admin",
    label: "System Administrator",
    desc: "Manage roles, permissions and audit logs.",
    icon: Settings,
    flow: "login",
  },
];
