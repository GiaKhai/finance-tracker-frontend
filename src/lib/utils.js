import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to currency string
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with thousand separators
 * @param {string|number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (!value) return "";

  // Remove non-numeric characters except decimal point
  const numericValue = value.toString().replace(/[^\d.]/g, "");

  // Split into integer and decimal parts
  const [integer, decimal] = numericValue.split(".");

  // Add thousand separators
  const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Return with decimal if exists
  return decimal !== undefined
    ? `${formattedInteger}.${decimal}`
    : formattedInteger;
}

/**
 * Parse formatted number string to float
 * @param {string} value
 * @returns {number}
 */
export function parseFormattedNumber(value) {
  if (!value) return 0;
  return parseFloat(value.toString().replace(/,/g, ""));
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for period
 * @param {string} period - 'day' | 'week' | 'month' | 'quarter' | 'year'
 * @returns {{ startDate: string, endDate: string }}
 */
export function getDateRange(period) {
  const now = new Date();
  const endDate = formatDate(now);
  let startDate;

  switch (period) {
    case "day":
      startDate = endDate;
      break;
    case "week":
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      startDate = formatDate(weekAgo);
      break;
    case "month":
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      startDate = formatDate(monthAgo);
      break;
    case "quarter":
      const quarterAgo = new Date(now.setMonth(now.getMonth() - 3));
      startDate = formatDate(quarterAgo);
      break;
    case "year":
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      startDate = formatDate(yearAgo);
      break;
    default:
      startDate = endDate;
  }

  return { startDate, endDate };
}
