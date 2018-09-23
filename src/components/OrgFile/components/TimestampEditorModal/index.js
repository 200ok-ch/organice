import React, { PureComponent, Fragment } from 'react';

import './TimestampEditorModal.css';

import TimestampEditor from './components/TimestampEditor';
import Popup from '../../../UI/Popup/';

import _ from 'lodash';
import moment from 'moment';
import { Map } from 'immutable';

export default class TimestampEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleAddEndTimestamp', 'handleRemoveEndTimestamp']);
  }

  handleChange(key) {
    return newTimestamp => this.props.onChange(this.props.timestamp.set(key, newTimestamp));
  }

  handleAddEndTimestamp() {
    const { timestamp } = this.props;
    const [year, month, day, dayName] = moment()
      .format('YYYY MM DD ddd')
      .split(' ');
    this.props.onChange(
      timestamp.set(
        'secondTimestamp',
        Map({
          year,
          month,
          day,
          dayName,
          isActive: timestamp.getIn(['firstTimestamp', 'isActive']),
        })
      )
    );
  }

  handleRemoveEndTimestamp() {
    this.props.onChange(this.props.timestamp.set('secondTimestamp', null));
  }

  render() {
    const { timestamp, onClose } = this.props;

    return (
      <Popup shouldIncludeCloseButton onClose={onClose}>
        <h2 className="timestamp-editor__title">Edit timestamp</h2>

        <TimestampEditor
          timestamp={timestamp.get('firstTimestamp')}
          onChange={this.handleChange('firstTimestamp')}
        />

        {!!timestamp.get('secondTimestamp') ? (
          <Fragment>
            <div className="timestamp-editor__separator">
              <div className="timestamp-editor__separator__margin-line" />
              to
              <div className="timestamp-editor__separator__margin-line" />
            </div>

            <TimestampEditor
              timestamp={timestamp.get('secondTimestamp')}
              onChange={this.handleChange('secondTimestamp')}
            />

            <div className="timestamp-editor__button-container">
              <button
                className="btn timestamp-editor__add-new-button"
                onClick={this.handleRemoveEndTimestamp}
              >
                Remove end timestamp
              </button>
            </div>
          </Fragment>
        ) : (
          <div className="timestamp-editor__button-container">
            <button
              className="btn timestamp-editor__add-new-button"
              onClick={this.handleAddEndTimestamp}
            >
              Add end timestamp
            </button>
          </div>
        )}
      </Popup>
    );
  }
}
