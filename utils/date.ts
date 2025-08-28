import { CalendarDate } from "@internationalized/date";

export const calculateFirstAndLastDayOfTheMonth = (date: Date) => {
  const firstDayOfMonth = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), 1)
  );
  const lastDayOfMonth = new Date(
    Date.UTC(date.getFullYear(), date.getMonth() + 1, 0)
  );

  // Format dates as UTC ISO strings for PostgreSQL
  const startDate = formatDateToUTCISOString(firstDayOfMonth);
  const endDate = formatDateToUTCISOString(lastDayOfMonth);
  return { startDate, endDate };
};

export const formatDateToUTCISOString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Calculate daily and monthly budget amounts based on user input type
 * @param budgetType - "daily" or "monthly"
 * @param budgetAmount - The amount the user entered
 * @param year - Year for calculating days in month
 * @param month - Month for calculating days in month (1-12)
 * @returns Object with dailyAmount and monthlyAmount
 */
export const calculateBudgetAmounts = (
  budgetType: "daily" | "monthly",
  budgetAmount: number,
  year: number,
  month: number
) => {
  // Get number of days in the specified month
  const daysInMonth = new Date(year, month, 0).getDate();

  if (budgetType === "daily") {
    return {
      dailyAmount: budgetAmount,
      monthlyAmount: budgetAmount * daysInMonth,
    };
  } else {
    return {
      dailyAmount: budgetAmount / daysInMonth,
      monthlyAmount: budgetAmount,
    };
  }
};

export const maxCalendarDate = () => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  return new CalendarDate(
    maxDate.getFullYear(),
    maxDate.getMonth() + 1, // Month is 0-indexed in JS Date, 1-indexed in CalendarDate
    maxDate.getDate()
  );
};
