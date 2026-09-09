import { format } from "date-fns";

function formatDate(value: string): string {
  return format(new Date(value), "dd/MM/yyyy");
}

function formatSentAt(value: string): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm");
}

function formatDateTime(value: string): string {
  return format(new Date(value), "dd/MM/yyyy HH:mm:ss");
}

export { formatDate, formatSentAt, formatDateTime };
