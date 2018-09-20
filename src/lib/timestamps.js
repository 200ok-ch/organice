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
