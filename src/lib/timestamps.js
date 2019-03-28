import formatDate from 'date-fns/format';
import parseDate from 'date-fns/parse';
import {
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isBefore,
} from 'date-fns';

export const renderAsText = timestamp => {
  const {
    isActive,
    year,
    month,
    day,
    dayName,
    startHour,
    startMinute,
    endHour,
    endMinute,
    repeaterType,
    repeaterValue,
    repeaterUnit,
    delayType,
    delayValue,
    delayUnit,
  } = timestamp.toJS();

  let timestampText = '';
  timestampText += isActive ? '<' : '[';
  timestampText += `${year}-${month}-${day}`;
  timestampText += !!dayName ? ` ${dayName}` : '';
  timestampText += !!startHour ? ` ${startHour}:${startMinute}` : '';
  timestampText += !!endHour ? `-${endHour}:${endMinute}` : '';
  timestampText += !!repeaterType ? ` ${repeaterType}${repeaterValue}${repeaterUnit}` : '';
  timestampText += !!delayType ? ` ${delayType}${delayValue}${delayUnit}` : '';
  timestampText += isActive ? '>' : ']';

  return timestampText;
};

export const getCurrentTimestamp = ({ isActive = true, withStartTime = false } = {}) => {
  const time = new Date();

  const timestamp = {
    isActive,
    year: formatDate(time, 'YYYY'),
    month: formatDate(time, 'MM'),
    day: formatDate(time, 'DD'),
    dayName: formatDate(time, 'ddd'),
    startHour: null,
    startMinute: null,
    endHour: null,
    endMinute: null,
    repeaterType: null,
    repeaterValue: null,
    repeaterUnit: null,
    delayType: null,
    delayValue: null,
    delayUnit: null,
  };

  if (withStartTime) {
    timestamp.startHour = formatDate(time, 'HH');
    timestamp.startMinute = formatDate(time, 'mm');
  }

  return timestamp;
};

export const getCurrentTimestampAsText = () => `<${formatDate(new Date(), 'YYYY-MM-DD ddd')}>`;

export const dateForTimestamp = timestamp => {
  const { year, month, day, startHour, startMinute } = timestamp.toJS();

  let timestampString = `${year}-${month}-${day}`;
  if (!!startHour && !!startMinute) {
    timestampString += ` ${startHour.padStart(2, '0')}:${startMinute}`;
  }

  return parseDate(timestampString);
};

export const addTimestampUnitToDate = (date, numUnits, timestampUnit) =>
  ({
    h: addHours(date, numUnits),
    d: addDays(date, numUnits),
    w: addWeeks(date, numUnits),
    m: addMonths(date, numUnits),
    y: addYears(date, numUnits),
  }[timestampUnit]);

export const subtractTimestampUnitFromDate = (date, numUnits, timestampUnit) =>
  ({
    h: subHours(date, numUnits),
    d: subDays(date, numUnits),
    w: subWeeks(date, numUnits),
    m: subMonths(date, numUnits),
    y: subYears(date, numUnits),
  }[timestampUnit]);

export const applyRepeater = (timestamp, currentDate) => {
  if (!timestamp.get('repeaterType')) {
    return timestamp;
  }

  let newDate = null;
  switch (timestamp.get('repeaterType')) {
    case '+':
      newDate = addTimestampUnitToDate(
        dateForTimestamp(timestamp),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      break;
    case '++':
      newDate = addTimestampUnitToDate(
        dateForTimestamp(timestamp),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      while (isBefore(newDate, currentDate)) {
        newDate = addTimestampUnitToDate(
          newDate,
          timestamp.get('repeaterValue'),
          timestamp.get('repeaterUnit')
        );
      }
      break;
    case '.+':
      newDate = addTimestampUnitToDate(
        new Date(),
        timestamp.get('repeaterValue'),
        timestamp.get('repeaterUnit')
      );
      break;
    default:
      console.error(`Unrecognized timestamp repeater type: ${timestamp.get('repeaterType')}`);
      return timestamp;
  }

  timestamp = timestamp
    .set('day', formatDate(newDate, 'DD'))
    .set('dayName', formatDate(newDate, 'ddd'))
    .set('month', formatDate(newDate, 'MM'))
    .set('year', formatDate(newDate, 'YYYY'));

  if (timestamp.get('startHour') !== undefined && timestamp.get('startHour') !== null) {
    timestamp = timestamp
      .set('startHour', formatDate(newDate, 'HH'))
      .set('startMinute', formatDate(newDate, 'mm'));
  }

  return timestamp;
};
