import React, { PureComponent } from 'react';

import './SyncConfirmationModal.css';

export default class SyncConfirmationModal extends PureComponent {
  render() {
    const { lastServerModifiedAt } = this.props;

    return (
      <div className="modal-container">
        <h2 className="sync-confirmation-modal__header">Sync conflict</h2>
        Since you last pulled, a newer version of the file has been pushed to the server.
        The newer version is from:

        <br />
        <br />

        <div className="sync-confirmation-modal__last-sync-time">
          {lastServerModifiedAt.format('MMMM Do, YYYY [at] h:mm:ss a')}
          <br />
          ({lastServerModifiedAt.fromNow()})
        </div>

        <div className="sync-confirmation-modal__buttons-container">
          <button className="btn sync-confirmation-modal__button">
            Pull latest version from server
          </button>
          <button className="btn sync-confirmation-modal__button">
            Overwrite server versionn
          </button>
          <button className="btn sync-confirmation-modal__button">
            Cancel sync
          </button>
        </div>
      </div>
    );
  }
}
