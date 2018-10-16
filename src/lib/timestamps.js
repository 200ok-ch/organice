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
    timestampString += ` ${startHour}:${startMinute}`;
  }

  return moment(timestampString);
};
