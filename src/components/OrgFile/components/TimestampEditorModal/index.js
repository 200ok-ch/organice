import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TimestampEditor from './components/TimestampEditor';

import _ from 'lodash';
import { format } from 'date-fns';
import { Map } from 'immutable';

export default class TimestampEditorModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleAddEndTimestamp', 'handleRemoveEndTimestamp']);
  }

  handleChange(key) {
    return (newTimestamp) => this.props.onChange(this.props.timestamp.set(key, newTimestamp));
  }

  handleAddEndTimestamp() {
    const { timestamp } = this.props;
    const [year, month, day, dayName] = format(new Date(), 'yyyy MM dd eee').split(' ');
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
    const {
      headerId,
      timestamp,
      timestampId,
      popupType,
      onClose,
      singleTimestampOnly,
      planningItemIndex,
    } = this.props;

    const timestampTitles = {
      'timestamp-editor': 'Edit timestamp',
      'scheduled-editor': 'Edit scheduled timestamp',
      'deadline-editor': 'Edit deadline',
    };

    return (
      <>
        <h2 className="timestamp-editor__title">{timestampTitles[popupType]}</h2>

        <TimestampEditor
          headerId={headerId}
          timestamp={timestamp && timestamp.get('firstTimestamp')}
          timestampId={timestampId}
          planningItemIndex={planningItemIndex}
          onClose={onClose}
          onChange={this.handleChange('firstTimestamp')}
        />

        {!singleTimestampOnly &&
          (!!timestamp.get('secondTimestamp') ? (
            <Fragment>
              <div className="timestamp-editor__separator">
                <div className="timestamp-editor__separator__margin-line" />
                to
                <div className="timestamp-editor__separator__margin-line" />
              </div>

              <TimestampEditor
                headerId={headerId}
                timestamp={timestamp.get('secondTimestamp')}
                timestampId={timestampId}
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
          ))}

        <br />
      </>
    );
  }
}
