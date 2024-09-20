import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Map } from 'immutable';

import './stylesheet.css';

import Switch from '../../../../../UI/Switch/';
import TabButtons from '../../../../../UI/TabButtons/';

import * as orgActions from '../../../../../../actions/org';
import * as baseActions from '../../../../../../actions/base';

import { renderAsText } from '../../../../../../lib/timestamps';
import { getSelectedHeader } from '../../../../../../lib/org_utils';

import _ from 'lodash';
import { parseISO, format } from 'date-fns';

class TimestampEditor extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleActiveToggle',
      'handleDateChange',
      'handleAddRepeater',
      'handleRemoveRepeater',
      'handleRepeaterTypeChange',
      'handleRepeaterValueChange',
      'handleRepeaterUnitChange',
      'handleAddDelay',
      'handleRemoveDelay',
      'handleDelayTypeChange',
      'handleDelayValueChange',
      'handleDelayUnitChange',
      'createPlanningItem',
    ]);
  }

  handleActiveToggle() {
    this.props.onChange(this.props.timestamp.update('isActive', (isActive) => !isActive));
  }

  handleDateChange(event, planningItemIndex, timestampId) {
    // The user deleted the timestamp
    if (_.isEmpty(event.target.value)) {
      // It's a planning item and the parser knows which one.
      if (_.isNumber(planningItemIndex)) {
        this.props.org.removePlanningItem(this.props.headerId, planningItemIndex);
      } else if (_.isNumber(timestampId)) {
        this.props.org.removeTimestamp(this.props.headerId, timestampId);
      }
      if (
        this.props.activePopupType !== 'scheduled-editor' &&
        this.props.activePopupType !== 'deadline-editor'
      ) {
        // for scheduled timestamp and deadline the modal can be open when no timestamp exists
        this.props.onClose();
      }
    } else {
      const { onChange, timestamp } = this.props;

      const [newYear, newMonth, newDay, newDayName] = format(
        parseISO(event.target.value),
        'yyyy MM dd eee'
      ).split(' ');
      onChange(
        timestamp
          .set('year', newYear)
          .set('month', newMonth)
          .set('day', newDay)
          .set('dayName', newDayName)
      );
    }
  }

  handleAddTime(startOrEnd) {
    return () => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] =
        startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      const [hour, minute] = format(new Date(), 'HH:mm').split(':');
      onChange(timestamp.set(hourKey, hour).set(minuteKey, minute));
    };
  }

  handleRemoveTime(startOrEnd) {
    return () => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] =
        startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      onChange(timestamp.set(hourKey, null).set(minuteKey, null));
    };
  }

  handleTimeChange(startOrEnd) {
    return (event) => {
      const { onChange, timestamp } = this.props;

      const [hourKey, minuteKey] =
        startOrEnd === 'start' ? ['startHour', 'startMinute'] : ['endHour', 'endMinute'];
      let [hour, minute] = event.target.value.split(':');
      hour = hour.startsWith('0') ? hour.substring(1) : hour;
      onChange(timestamp.set(hourKey, hour).set(minuteKey, minute));
    };
  }

  handleAddRepeater() {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('repeaterType', '+').set('repeaterValue', 1).set('repeaterUnit', 'h'));
  }

  handleRemoveRepeater() {
    const { onChange, timestamp } = this.props;
    onChange(
      timestamp.set('repeaterType', null).set('repeaterValue', null).set('repeaterUnit', null)
    );
  }

  handleRepeaterTypeChange(newRepeaterType) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('repeaterType', newRepeaterType));
  }

  handleRepeaterValueChange(event) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('repeaterValue', event.target.value));
  }

  handleRepeaterUnitChange(newRepeaterUnit) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('repeaterUnit', newRepeaterUnit));
  }

  handleAddDelay() {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('delayType', '-').set('delayValue', 1).set('delayUnit', 'h'));
  }

  handleRemoveDelay() {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('delayType', null).set('delayValue', null).set('delayUnit', null));
  }

  handleDelayTypeChange(newDelayType) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('delayType', newDelayType));
  }

  handleDelayValueChange(event) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('delayValue', event.target.value));
  }

  handleDelayUnitChange(newDelayUnit) {
    const { onChange, timestamp } = this.props;
    onChange(timestamp.set('delayUnit', newDelayUnit));
  }

  renderTimeField(label, timeKey, hour, minute, showRemoveButton = true) {
    return (
      <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
        <div className="timestamp-editor__field-title">{label}</div>
        <div className="timestamp-editor__field">
          {!!hour ? (
            <Fragment>
              <input
                type="time"
                className="timestamp-editor__time-input"
                value={`${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`}
                onChange={this.handleTimeChange(timeKey)}
              />
              {showRemoveButton && (
                <i
                  className="fas fa-times fa-lg timestamp-editor__icon timestamp-editor__icon--remove"
                  onClick={this.handleRemoveTime(timeKey)}
                />
              )}
            </Fragment>
          ) : (
            <i
              className="fas fa-plus timestamp-editor__icon timestamp-editor__icon--add"
              onClick={this.handleAddTime(timeKey)}
            />
          )}
        </div>
      </div>
    );
  }

  renderRepeater() {
    const { repeaterType, repeaterValue, repeaterUnit } = this.props.timestamp.toJS();

    return (
      <div className="timestamp-editor__field-container">
        <div className="timestamp-editor__field-title">Repeater</div>
        <div className="timestamp-editor__field timestamp-editor__field--delay-repeater">
          {!!repeaterType ? (
            <Fragment>
              <div className="timestamp-editor__delay-repeater-type">
                <TabButtons
                  buttons={['+', '++', '.+']}
                  titles={[
                    'Shift exactly the amount of time in the repeater (i.e. one month for +1m).',
                    'Shift the date by as many intervals of the amount of time in the repeater (i.e. one or many months for for ++1m) as it takes to get this date into the future.',
                    'Shift the date exactly the amount of time of the repeater relative to the time of the state change.',
                  ]}
                  selectedButton={repeaterType || '+'}
                  onSelect={this.handleRepeaterTypeChange}
                />
              </div>
              <input
                type="number"
                min="1"
                className="textfield delay-repeater-value-input"
                value={repeaterValue || 1}
                onChange={this.handleRepeaterValueChange}
              />
              <div>
                <TabButtons
                  buttons={['h', 'd', 'w', 'm', 'y']}
                  titles={['hours', 'days', 'weeks', 'months', 'years']}
                  selectedButton={repeaterUnit || 'h'}
                  onSelect={this.handleRepeaterUnitChange}
                />
              </div>
              <i
                className="fas fa-times fa-lg timestamp-editor__icon timestamp-editor__icon--remove"
                onClick={this.handleRemoveRepeater}
              />
            </Fragment>
          ) : (
            <i
              className="fas fa-plus timestamp-editor__icon timestamp-editor__icon--add"
              onClick={this.handleAddRepeater}
            />
          )}
        </div>
      </div>
    );
  }

  renderDelay() {
    const { delayType, delayValue, delayUnit } = this.props.timestamp.toJS();

    return (
      <div className="timestamp-editor__field-container">
        <div className="timestamp-editor__field-title">Delay</div>
        <div className="timestamp-editor__field">
          {!!delayType ? (
            <Fragment>
              <div className="timestamp-editor__delay-repeater-type">
                <TabButtons
                  buttons={['-', '--']}
                  titles={[
                    'Set a different lead time before the entry is put into the agenda.',
                    "In case the task contains a repeater, the delay is considered to affect all occurrences; if you want the delay to only affect the first scheduled occurrence of the task, use '--' instead.",
                  ]}
                  selectedButton={delayType || '-'}
                  onSelect={this.handleDelayTypeChange}
                />
              </div>
              <input
                type="number"
                min="1"
                className="textfield delay-repeater-value-input"
                value={delayValue || 1}
                onChange={this.handleDelayValueChange}
              />
              <div>
                <TabButtons
                  buttons={['h', 'd', 'w', 'm', 'y']}
                  titles={['hours', 'days', 'weeks', 'months', 'years']}
                  selectedButton={delayUnit || 'h'}
                  onSelect={this.handleDelayUnitChange}
                />
              </div>
              <i
                className="fas fa-times fa-lg timestamp-editor__icon timestamp-editor__icon--remove"
                onClick={this.handleRemoveDelay}
              />
            </Fragment>
          ) : (
            <i
              className="fas fa-plus timestamp-editor__icon timestamp-editor__icon--add"
              onClick={this.handleAddDelay}
            />
          )}
        </div>
      </div>
    );
  }

  createPlanningItem() {
    const { selectedHeaderId, header, activePopupType } = this.props;
    const planningType = { 'deadline-editor': 'DEADLINE', 'scheduled-editor': 'SCHEDULED' }[
      activePopupType
    ];
    this.props.org.addNewPlanningItem(selectedHeaderId, planningType);
    this.props.base.activatePopup(activePopupType, {
      headerId: selectedHeaderId,
      planningItemIndex: header.get('planningItems').size,
    });
  }

  render() {
    const { timestamp, timestampId, planningItemIndex } = this.props;
    if (!timestamp) {
      // for scheduled timestamp and deadline the modal can be opened when no timestamp exists
      return (
        <>
          <div className="timestamp-editor__field-title">Add Timestamp</div>
          <div className="timestamp-editor__field">
            <i
              className="fas fa-plus timestamp-editor__icon timestamp-editor__icon--add"
              onClick={this.createPlanningItem}
            />
          </div>
        </>
      );
    }
    const { isActive, year, month, day, startHour, startMinute, endHour, endMinute } =
      timestamp.toJS();
    return (
      <div>
        <div className="timestamp-editor__render">{renderAsText(timestamp)}</div>

        <div className="timestamp-editor__date-time-fields-container">
          <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
            <div className="timestamp-editor__field-title">Active</div>
            <div className="timestamp-editor__field">
              <Switch isEnabled={isActive} onToggle={this.handleActiveToggle} />
            </div>
          </div>

          <div className="timestamp-editor__field-container timestamp-editor__field-container--inline">
            <div className="timestamp-editor__field-title">Date</div>
            <div className="timestamp-editor__field">
              <input
                data-testid="timestamp-selector"
                type="date"
                className="timestamp-editor__date-input"
                onChange={(event) => this.handleDateChange(event, planningItemIndex, timestampId)}
                // Needed for iOS due to React bug
                // https://github.com/facebook/react/issues/8938#issuecomment-519074141
                onFocus={(event) => (event.nativeEvent.target.defaultValue = '')}
                value={`${year}-${month}-${day}`}
              />
            </div>
          </div>

          {this.renderTimeField('Start time', 'start', startHour, startMinute, !endHour)}
          {!!startHour && this.renderTimeField('End time', 'end', endHour, endMinute)}
        </div>

        {this.renderRepeater()}
        {this.renderDelay()}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path], Map());
  const activePopup = state.base.get('activePopup');
  return {
    selectedHeaderId: file.get('selectedHeaderId'),
    header: getSelectedHeader(state),
    activePopupType: !!activePopup ? activePopup.get('type') : null,
    activePopupData: !!activePopup ? activePopup.get('data') : null,
  };
};

const mapDispatchToProps = (dispatch) => ({
  org: bindActionCreators(orgActions, dispatch),
  base: bindActionCreators(baseActions, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(TimestampEditor);
