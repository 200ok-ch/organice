import React, { PureComponent, Fragment } from 'react';

import './TimestampPart.css';

export default class TimestampPart extends PureComponent {
  renderTimestamp(timestamp) {
    const [
      isActive,
      year, month, day, dayName,
      startHour, startMinute,
      endHour, endMinute,
      repeaterType, repeaterValue, repeaterUnit,
      delayType, delayValue, delayUnit,
    ] = [
      'isActive',
      'year', 'month', 'day', 'dayName',
      'startHour', 'startMinute',
      'endHour', 'endMinute',
      'repeaterType', 'repeaterValue', 'repeaterUnit',
      'delayType', 'delayValue', 'delayUnit',
    ].map(key => timestamp.get(key));

    return (
      <Fragment>
        {isActive ? '<' : '['}
        {year}-{month}-{day}
        {!!dayName ? ` ${dayName}` : ''}
        {!!startHour ? ` ${startHour}:${startMinute}` : ''}
        {!!endHour ? `-${endHour}:${endMinute}` : ''}
        {!!repeaterType ? ` ${repeaterType}${repeaterValue}${repeaterUnit}` : ''}
        {!!delayType ? ` ${delayType}${delayValue}${delayUnit}` : ''}
        {isActive ? '>' : ']'}
      </Fragment>
    );
  }

  render() {
    const { part } = this.props;
    const firstTimestamp = part.get('firstTimestamp');
    const secondTimestamp = part.get('secondTimestamp');

    return (
      <span className="attributed-string__timestamp-part">
        {!!firstTimestamp && this.renderTimestamp(firstTimestamp)}
        {!!secondTimestamp && (
          <Fragment>
            {'--'}{this.renderTimestamp(secondTimestamp)}
          </Fragment>
        )}
      </span>
    );
  }
}
