/**
 * Shared transaction utilities used by both ClientDashboard and VendorDashboard.
 * Centralised here to prevent duplication.
 */

export const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-gray-400",
  "bg-teal-400",
  "bg-amber-400",
  "bg-orange-400",
];

export const getAvatarColor = (index) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

export const getStatusColor = (status) => {
  switch (status) {
    case "FULFILLED":   return "bg-green-100 text-green-600";
    case "INITIATED":   return "bg-yellow-100 text-yellow-600";
    case "DECLINED":    return "bg-red-100 text-red-600";
    case "CANCELLED":   return "bg-red-100 text-red-600";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-600";
    default:            return "bg-gray-100 text-gray-600";
  }
};

export const STATUS_MAP = [
  { name: "All" },
  { name: "Initiated" },
  { name: "Declined" },
  { name: "Cancelled" },
  { name: "In Progress" },
  { name: "Fulfilled" },
];
