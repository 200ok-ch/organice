// INFO: There's an <ActionDrawer> component within the <OrgFile>
// component, as well.

import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './../../../OrgFile/components/ActionDrawer/stylesheet.css';

import * as orgActions from '../../../../actions/org';
import * as captureActions from '../../../../actions/capture';
import * as baseActions from '../../../../actions/base';
import * as syncActions from '../../../../actions/sync_backend';

import ActionButton from '../../../OrgFile/components/ActionDrawer/components/ActionButton';

const ActionDrawer = ({ org, syncBackend, base, path }) => {
  const handleAddNewOrgFileClick = () => {
    // TODO: Do it like this?
    // base.activatePopup('addFile');
    let fileName = prompt('New filename:');
    let newPath = `${path}/${fileName}`;
    syncBackend.createFile(newPath);
    org.addNewFile(newPath);
  };

  const mainButtonStyle = {
    opacity: 1,
    position: 'relative',
    zIndex: 1,
  };

  return (
    <div className="action-drawer-container nice-scroll">
      {
        <Fragment>
          <div
            className="action-drawer__capture-buttons-container"
            style={{
              marginLeft: 'auto',
              marginRight: 0,
            }}
          >
            <ActionButton
              iconName="plus"
              isDisabled={false}
              onClick={handleAddNewOrgFileClick}
              style={mainButtonStyle}
              tooltip="Add new Org file"
            />
          </div>
        </Fragment>
      }
    </div>
  );
};

const mapStateToProps = (state) => {
  const path = state.syncBackend.get('currentPath');
  // const files = state.org.present.get('files');
  return {
    path,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    capture: bindActionCreators(captureActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
    syncBackend: bindActionCreators(syncActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionDrawer);
