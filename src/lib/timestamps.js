import moment from 'moment';

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

export const getCurrentTimestamp = () => {
  const time = moment();

  return {
    isActive: true,
    year: time.format('YYYY'),
    month: time.format('MM'),
    day: time.format('DD'),
    dayName: time.format('ddd'),
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
};

export const getCurrentTimestampAsText = () => `<${moment().format('YYYY-MM-DD ddd')}>`;

export const momentDateForTimestamp = timestamp => {
  const { year, month, day, startHour, startMinute } = timestamp.toJS();

  let timestampString = `${year}-${month}-${day}`;
  if (!!startHour && !!startMinute) {
    timestampString += ` ${startHour.padStart(2, '0')}:${startMinute}`;
  }

  return moment(timestampString);
};

export const momentUnitForTimestampUnit = timestampUnit =>
  ({
    h: 'hours',
    d: 'days',
    w: 'weeks',
    m: 'months',
    y: 'years',
  }[timestampUnit]);

export const applyRepeater = (timestamp, currentDate) => {
  if (!timestamp.get('repeaterType')) {
    return timestamp;
  }

  const momentUnit = momentUnitForTimestampUnit(timestamp.get('repeaterUnit'));

  let newDate = null;
  switch (timestamp.get('repeaterType')) {
    case '+':
      newDate = momentDateForTimestamp(timestamp).add(timestamp.get('repeaterValue'), momentUnit);
      break;
    case '++':
      newDate = momentDateForTimestamp(timestamp).add(timestamp.get('repeaterValue'), momentUnit);
      while (newDate < currentDate) {
        newDate = newDate.add(timestamp.get('repeaterValue'), momentUnit);
      }
      break;
    case '.+':
      newDate = currentDate.clone().add(timestamp.get('repeaterValue'), momentUnit);
      break;
    default:
      console.error(`Unrecognized timestamp repeater type: ${timestamp.get('repeaterType')}`);
      return timestamp;
  }

  timestamp = timestamp
    .set('day', newDate.format('DD'))
    .set('dayName', newDate.format('ddd'))
    .set('month', newDate.format('MM'))
    .set('year', newDate.format('YYYY'));

  if (timestamp.get('startHour') !== undefined && timestamp.get('startHour') !== null) {
    timestamp = timestamp
      .set('startHour', newDate.format('HH'))
      .set('startMinute', newDate.format('mm'));
  }

  return timestamp;
};
