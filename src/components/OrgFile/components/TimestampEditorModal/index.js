import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import TimestampEditor from './components/TimestampEditor';
import Drawer from '../../../UI/Drawer/';

import _ from 'lodash';
import format from 'date-fns/format';
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
    const { timestamp, onClose, singleTimestampOnly, planningItemIndex } = this.props;

    return (
      <Drawer onClose={onClose}>
        <h2 className="timestamp-editor__title">Edit timestamp</h2>

        <TimestampEditor
          timestamp={timestamp.get('firstTimestamp')}
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
          ))}

        <br />
      </Drawer>
    );
  }
}
