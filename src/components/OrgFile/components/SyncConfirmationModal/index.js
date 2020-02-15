import React from 'react';

import './stylesheet.css';

import Drawer from '../../../UI/Drawer/';

import { customFormatDistanceToNow } from '../../../../lib/org_utils';
import format from 'date-fns/format';

export default ({ lastServerModifiedAt, onPull, onPush, onCancel }) => {
  return (
    <Drawer>
      <h2 className="sync-confirmation-modal__header">Sync conflict</h2>
      Since you last pulled, a newer version of the file has been pushed to the server. The newer
      version is from:
      <br />
      <br />
      <div className="sync-confirmation-modal__last-sync-time">
        {format(lastServerModifiedAt, 'MMMM do, yyyy [at] h:mm:ss a')}
        <br />({customFormatDistanceToNow(lastServerModifiedAt)})
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
      <br />
    </Drawer>
  );
};
