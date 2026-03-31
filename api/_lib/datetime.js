function isValidTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== 'string') {
    return false;
  }

  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(rawTimeZone) {
  return isValidTimeZone(rawTimeZone) ? rawTimeZone : 'UTC';
}

function getLocalDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return { year, month, day };
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateIso(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function getLocalDateISO(date, timeZone) {
  return toDateIso(getLocalDateParts(date, timeZone));
}

function dateIsoToDayNumber(dateIso) {
  const [year, month, day] = String(dateIso).split('-').map((value) => Number(value));
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function addDays(dateIso, deltaDays) {
  const dayNumber = dateIsoToDayNumber(dateIso);
  const shifted = new Date((dayNumber + deltaDays) * 86400000);
  return getLocalDateISO(shifted, 'UTC');
}

function diffDays(startDateIso, endDateIso) {
  return dateIsoToDayNumber(endDateIso) - dateIsoToDayNumber(startDateIso);
}

function parseShortOffset(tzName) {
  const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(tzName || '');

  if (!match) {
    return 0;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function getOffsetMinutesAt(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const tzName = formatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  return parseShortOffset(tzName);
}

function localDateStartUtc(dateIso, timeZone) {
  const [year, month, day] = String(dateIso).split('-').map((value) => Number(value));
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetMinutes = getOffsetMinutesAt(probe, timeZone);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000);
}

function endOfLocalDayUtcISO(dateIso, timeZone) {
  const nextDateIso = addDays(dateIso, 1);
  const nextStart = localDateStartUtc(nextDateIso, timeZone);
  return new Date(nextStart.getTime() - 1).toISOString();
}

function getRecentDateRange(todayIso, days) {
  const range = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    range.push(addDays(todayIso, -i));
  }
  return range;
}

module.exports = {
  addDays,
  diffDays,
  endOfLocalDayUtcISO,
  getLocalDateISO,
  getRecentDateRange,
  resolveTimeZone,
};
