import {
  ESTIMATED_ARRIVAL_DAYS_MIN,
  ESTIMATED_ARRIVAL_DAYS_MAX,
} from "@/lib/constants/checkout-constants";

export function calculateEstimatedArrivalDate(): string {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + ESTIMATED_ARRIVAL_DAYS_MIN);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + ESTIMATED_ARRIVAL_DAYS_MAX);

  // Format: "Thu 5 Feb - Wed 11 Feb"
  const format = (date: Date) =>
    date
      .toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
      .replace(/,/g, "");

  return `${format(minDate)} - ${format(maxDate)}`;
}

/** @deprecated Use calculateEstimatedArrivalDate */
export const calculateMockArrivalDate = calculateEstimatedArrivalDate;
