import React, { PureComponent, Fragment } from 'react';

import './TimestampEditor.css';

import Switch from '../../../../../UI/Switch/';

import { renderAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';

export default class TimestampEditor extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleActiveToggle']);
  }

  handleActiveToggle() {
    this.props.onChange(this.props.timestamp.update('isActive', isActive => !isActive));
  }

  renderTimeField(label, hour, minute) {
    return (
      <div className="timestamp-editor__field-container">
        <span className="timestamp-editor__field-title">{label}:</span>
        {!!hour ? (
          <Fragment>
            <span className="timestamp-editor__field">{hour}:{minute}</span>
            <i className="fas fa-pencil-alt timestamp-editor__icon" />
            <i className="fas fa-times timestamp-editor__icon" />
          </Fragment>
        ) : (
          <i className="fas fa-plus timestamp-editor__icon" />
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
          <span className="timestamp-editor__field"><Switch isEnabled={isActive} onToggle={this.handleActiveToggle} /></span>
        </div>

        <div className="timestamp-editor__field-container">
          <span className="timestamp-editor__field-title">Date:</span>
          <span className="timestamp-editor__field">{timestamp.get('year')}-{timestamp.get('month')}-{timestamp.get('day')}</span>
          <i className="fas fa-pencil-alt timestamp-editor__icon" />
        </div>

        {this.renderTimeField('Start time', startHour, startMinute)}
        {this.renderTimeField('End time', endHour, endMinute)}
      </div>
    );
  }
}
