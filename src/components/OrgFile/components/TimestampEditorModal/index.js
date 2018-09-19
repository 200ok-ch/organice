import React, { PureComponent } from 'react';

import './TimestampEditorModal.css';

import TimestampEditor from './components/TimestampEditor';
import Popup from '../../../UI/Popup/';

export default class TimestampEditorModal extends PureComponent {
  handleChange(key) {
    return newTimestamp => this.props.onChange(this.props.timestamp.set(key, newTimestamp));
  }

  render() {
    const { timestamp, onClose } = this.props;
    console.log("timestamp = ", timestamp.toJS());

    return (
      <Popup shouldIncludeCloseButton onClose={onClose}>
        <h2 className="timestamp-editor__title">
          Edit timestamp
        </h2>

        <TimestampEditor timestamp={timestamp.get('firstTimestamp')}
                         onChange={this.handleChange('firstTimestamp')} />
      </Popup>
    );
  }
}
