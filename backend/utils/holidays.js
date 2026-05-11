// Pre-defined list of company holidays for the current year (YYYY-MM-DD format)
const publicHolidays = [
  '2024-01-01', // New Year
  '2024-01-26', // Republic Day
  '2024-08-15', // Independence Day
  '2024-10-02', // Gandhi Jayanti
  '2024-10-31', // Diwali (approximate/example)
  '2024-12-25', // Christmas
  // Add other years as needed
];

// Utility to check if a given date is a working day
exports.isWorkingDay = (date) => {
  const day = date.getDay();
  // Exclude Sundays (0) and Saturdays (6)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Exclude public holidays
  const dateStr = date.toISOString().split('T')[0];
  if (publicHolidays.includes(dateStr)) {
    return false;
  }

  return true;
};
