export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function nextDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '';
  return localDateString(new Date(year, month - 1, day + 1));
}

export function displayDate(value) {
  if (!value) return 'dd-mm-yyyy';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}
