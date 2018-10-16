import React, { PureComponent } from 'react';

import './stylesheet.css';

export default class AgendaDay extends PureComponent {
  render() {
    const { date, headers } = this.props;

    return (
      <div className="agenda-day__container">
        <div className="agenda-day__title">
          <div className="agenda-day__title__day-name">{date.format('dddd')}</div>
          <div className="agenda-day__title__date">{date.format('MMMM Do, YYYY')}</div>
        </div>

        <div className="agenda-day__headers-container">
          {headers.map(header => {
            return <div key={header.get('id')}>{header.getIn(['titleLine', 'rawTitle'])}</div>;
          })}
        </div>
      </div>
    );
  }
}
