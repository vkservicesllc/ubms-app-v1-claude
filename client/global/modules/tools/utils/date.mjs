export const getDateFromString = (dateStr) => {
  let year, month, day;

  if (dateStr.includes('-')) [year, month, day] = dateStr.split('-');
  else if (dateStr.includes('/')) [month, day, year] = dateStr.split('/');
  else if (dateStr.includes('.')) [day, month, year] = dateStr.split('.');
  else return;

  return new Date(+year, +month - 1, +day);
};

export const formatDateToString = (date, format) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return createDateString(year, month, day, format);
};

export const reformatDateString = (dateStr, format) => {
  let year, month, day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) [year, month, day] = dateStr.split('-');
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) [month, day, year] = dateStr.split('/');
  else if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) [day, month, year] = dateStr.split('.');

  return createDateString(year, month, day, format);
};

export const calculateYearAge = (date, asOf = null) => {
  if (typeof date == 'string') date = getDateFromString(date);
  if (!date) return;

  const today = asOf ? getDateFromString(asOf) : new Date();

  date.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);

  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const todayMonth = today.getUTCMonth();
  const dateMonth = date.getUTCMonth();
  const passed =
    todayMonth > dateMonth || (todayMonth === dateMonth && today.getUTCDate() >= date.getUTCDate());

  if (!passed) age--;

  return age;
};

export const calculateHourAge = (date) => {
  console.log('supplied date: ', date, typeof date);
  if (typeof date == 'string') date = getDateFromString(date);
  console.log('date: ', date);
  if (!date) return;

  const today = new Date();

  date.setUTCHours(0, 0, 0, 0);
  today.setUTCHours(0, 0, 0, 0);

  return (today - date) / (1000 * 60 * 6);
};

function createDateString(year, month, day, format) {
  switch (format) {
    case 'us':
      return `${month}/${day}/${year}`;
    case 'int':
      return `${day}.${month}.${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}
