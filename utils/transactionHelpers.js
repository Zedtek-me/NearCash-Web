/**
 * Shared transaction utilities used by both ClientDashboard and VendorDashboard.
 * Centralised here to prevent duplication.
 */

export const AVATAR_COLORS = [
  "bg-blue-400",
  "bg-gray-400",
  "bg-indigo-400",
  "bg-amber-400",
  "bg-orange-400",
];

export const getAvatarColor = (index) =>
  AVATAR_COLORS[index % AVATAR_COLORS.length];

export const getStatusColor = (status) => {
  switch (status) {
    case "FULFILLED":   return "bg-indigo-100 text-indigo-600";
    case "INITIATED":   return "bg-yellow-100 text-yellow-600";
    case "DECLINED":    return "bg-red-100 text-red-600";
    case "CANCELLED":   return "bg-red-100 text-red-600";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-600";
    default:            return "bg-gray-100 text-gray-600";
  }
};

/** Formats a numeric amount with locale-aware thousands separators. */
export const formatAmount = (value) =>
  Number(value || 0).toLocaleString();

/**
 * Formats a raw amount input string with thousands separators as the user types.
 * Strips non-numeric characters (except one decimal point), then re-formats.
 * Use as the onChange handler value transformer for monetary inputs.
 * Pairs with parseAmountInput() at submit time.
 */
export const formatAmountInput = (value) => {
  const raw = String(value).replace(/[^0-9.]/g, '');
  if (!raw) return '';
  const parts = raw.split('.');
  parts[0] = parts[0] ? Number(parts[0]).toLocaleString('en') : '';
  return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

/**
 * Strips thousands separators and parses a formatted amount string to float.
 * Use at form submission time to get the raw numeric value.
 */
export const parseAmountInput = (value) =>
  parseFloat(String(value).replace(/,/g, '')) || 0;

/**
 * Formats a range string like "1000-5000" into "1,000 - 5,000".
 * Each segment separated by "-" is treated as an independent figure.
 */
export const formatRange = (range) => {
  if (!range) return "";
  return range
    .split("-")
    .map((n) => {
      const trimmed  = n.trim();
      const hasPlus  = trimmed.endsWith("+");
      const numeric  = Number(hasPlus ? trimmed.slice(0, -1) : trimmed);
      return isNaN(numeric) ? trimmed : `₦${numeric.toLocaleString()}${hasPlus ? "+" : ""}`;
    })
    .join(" - ");
};

export const STATUS_MAP = [
  { name: "All" },
  { name: "Initiated" },
  { name: "Declined" },
  { name: "Cancelled" },
  { name: "In Progress" },
  { name: "Fulfilled" },
];
