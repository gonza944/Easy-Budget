export const calculateFirstAndLastDayOfTheMonth = (date: Date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  // Format dates as ISO strings for PostgreSQL
  const startDate = formatDateForSupabase(firstDayOfMonth);
  const endDate = formatDateForSupabase(lastDayOfMonth);
  return { startDate, endDate };
}

export const formatDateForSupabase = (date: Date) => {
  return date.toISOString().split('T')[0];
}