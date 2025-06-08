export const calculateFirstAndLastDayOfTheMonth = (date: Date) => {
  const firstDayOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
  const lastDayOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0));

  // Format dates as UTC ISO strings for PostgreSQL
  const startDate = formatDateToUTCISOString(firstDayOfMonth);
  const endDate = formatDateToUTCISOString(lastDayOfMonth);
  return { startDate, endDate };
}

export const formatDateToUTCISOString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}