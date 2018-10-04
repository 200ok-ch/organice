import React, { PureComponent } from 'react';

import './stylesheet.css';

import Popup from '../../../UI/Popup/';

export default class SyncConfirmationModal extends PureComponent {
  render() {
    const { lastServerModifiedAt, onPull, onPush, onCancel } = this.props;

    return (
      <Popup>
        <h2 className="sync-confirmation-modal__header">Sync conflict</h2>
        Since you last pulled, a newer version of the file has been pushed to the server. The newer
        version is from:
        <br />
        <br />
        <div className="sync-confirmation-modal__last-sync-time">
          {lastServerModifiedAt.format('MMMM Do, YYYY [at] h:mm:ss a')}
          <br />({lastServerModifiedAt.fromNow()})
        </div>
        <div className="sync-confirmation-modal__buttons-container">
          <button className="btn sync-confirmation-modal__button" onClick={onPull}>
            Pull latest version from server
          </button>
          <button className="btn sync-confirmation-modal__button" onClick={onPush}>
            Overwrite server version
          </button>
          <button className="btn sync-confirmation-modal__button" onClick={onCancel}>
            Cancel sync
          </button>
        </div>
      </Popup>
    );
  }
}
