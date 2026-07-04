import { clsx } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";

import type { ProcessingStatus } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeStatus(status: ProcessingStatus) {
  if (status === "review_required") {
    return "Review required";
  }

  return titleCase(status);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return format(parseISO(value), "dd MMM yyyy");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return format(parseISO(value), "dd MMM yyyy, h:mm a");
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return "-";
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function joinLines(values: string[]) {
  return values.join("\n");
}

export function safeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function summarizeList(values: string[], fallback = "-") {
  return values.length ? values.join(", ") : fallback;
}

export function compactText(value: string, maxLength = 220) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

export function normalizeToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s/&-]+/g, "")
    .replace(/\s+/g, " ");
}
