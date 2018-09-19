import React, { PureComponent } from 'react';

import './TimestampEditorModal.css';

import Popup from '../../../UI/Popup/';

export default class TimestampEditorModal extends PureComponent {
  render() {
    const { timestamp, onClose } = this.props;
    console.log("timestamp = ", timestamp.toJS());

    return (
      <Popup shouldIncludeCloseButton onClose={onClose}>
        {timestamp}
      </Popup>
    );
  }
}
