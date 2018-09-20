import React, { PureComponent, Fragment } from 'react';

import './TimestampEditor.css';

import Switch from '../../../../../UI/Switch/';

import { renderAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';
import moment from 'moment';

export default class TimestampEditor extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleActiveToggle',
      'handleDateChange',
      'handleDateEditClick',
    ]);
  }

  handleActiveToggle() {
    this.props.onChange(this.props.timestamp.update('isActive', isActive => !isActive));
  }

  handleDateChange(event) {
    const { onChange, timestamp } = this.props;

    const [newYear, newMonth, newDay] = event.target.value.split('-');
    onChange(timestamp.set('year', newYear).set('month', newMonth).set('day', newDay));
  }

  handleDateEditClick() {
    if (!!this.dateInput) {
      this.dateInput.focus();
    }
  }

  handleAddTime(startOrEnd) {
    return () => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] = startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      const [hour, minute] = moment().format("H:m").split(':');
      onChange(timestamp.set(hourKey, hour).set(minuteKey, minute));
    };
  }

  handleRemoveTime(startOrEnd) {
    return () => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] = startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      onChange(timestamp.set(hourKey, null).set(minuteKey, null));
    };
  }

  handleTimeChange(startOrEnd) {
    return event => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] = startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      const [hour, minute] = event.target.value.split(':');
      onChange(timestamp.set(hourKey, hour).set(minuteKey, minute));
    };
  }

  renderTimeField(label, timeKey, hour, minute, showRemoveButton = true) {
    return (
      <div className="timestamp-editor__field-container">
        <span className="timestamp-editor__field-title">{label}:</span>
        {!!hour ? (
          <Fragment>
            <input type="time" value={`${hour}:${minute}`} onChange={this.handleTimeChange(timeKey)} />
            <i className="fas fa-pencil-alt timestamp-editor__icon" />
            {showRemoveButton && <i className="fas fa-times timestamp-editor__icon" onClick={this.handleRemoveTime(timeKey)} />}
          </Fragment>
        ) : (
          <i className="fas fa-plus timestamp-editor__icon" onClick={this.handleAddTime(timeKey)} />
        )}
      </div>
    );
  }

  render() {
    const { timestamp } = this.props;
    const {
      isActive,
      year, month, day, dayName,
      startHour, startMinute,
      endHour, endMinute,
      repeaterType, repeaterValue, repeaterUnit,
      delayType, delayValue, delayUnit,
    } = timestamp.toJS();

    return (
      <div>
        <div className="timestamp-editor__render">{renderAsText(timestamp)}</div>

        <div className="timestamp-editor__field-container">
          <span className="timestamp-editor__field-title">Active:</span>
          <span className="timestamp-editor__field">
            <Switch isEnabled={isActive} onToggle={this.handleActiveToggle} />
          </span>
        </div>

        <div className="timestamp-editor__field-container">
          <span className="timestamp-editor__field-title">Date:</span>
          <input type="date"
                 ref={input => this.dateInput = input}
                 onChange={this.handleDateChange}
                 value={`${timestamp.get('year')}-${timestamp.get('month')}-${timestamp.get('day')}`} />
          <i className="fas fa-pencil-alt timestamp-editor__icon" onClick={this.handleDateEditClick} />
        </div>

        {this.renderTimeField('Start time', 'start', startHour, startMinute, !endHour)}
        {!!startHour && this.renderTimeField('End time', 'end', endHour, endMinute)}
      </div>
    );
  }
}
