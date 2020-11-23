import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Droppable } from 'react-beautiful-dnd';

import './stylesheet.css';

import * as orgActions from '../../actions/org';

import FileSetting from './components/FileSetting';

import { List } from 'immutable';
import { STATIC_FILE_PREFIX } from '../../lib/org_utils';

const FileSettingsEditor = ({ fileSettings, loadedFilepaths, org }) => {
  const handleAddNewSettingClick = () => org.addNewEmptyFileSetting();

  const handleFieldPathUpdate = (settingId, fieldPath, newValue) =>
    org.updateFileSettingFieldPathValue(settingId, fieldPath, newValue);

  const handleDeleteSetting = (settingId) => org.deleteFileSetting(settingId);

  const handleReorderSetting = (fromIndex, toIndex) => org.reorderFileSetting(fromIndex, toIndex);

  return (
    <div>
      <Droppable droppableId="file-setting-editor-droppable" type="FILE-SETTING">
        {(provided) => (
          <div
            className="file-setting-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {fileSettings.size === 0 ? (
              <div className="no-file-setting-message">
                You don't currently have any file settings - add one by pressing the{' '}
                <i className="fas fa-plus" /> button.
                <br />
                <br />
                File settings allow you to configure how specific files are handeled when multiple
                files are loaded. Make sure a file is loaded to create a setting entry.
              </div>
            ) : (
              <Fragment>
                {fileSettings.map((setting, index) => (
                  <FileSetting
                    key={setting.get('id')}
                    index={index}
                    setting={setting}
                    loadedFilepaths={loadedFilepaths}
                    onFieldPathUpdate={handleFieldPathUpdate}
                    onDeleteSetting={handleDeleteSetting}
                    onReorder={handleReorderSetting}
                  />
                ))}

                {provided.placeholder}
              </Fragment>
            )}
          </div>
        )}
      </Droppable>

      {loadedFilepaths.length !== 0 && (
        <div className="new-capture-template-button-container">
          <button
            className="fas fa-plus fa-lg btn btn--circle"
            onClick={handleAddNewSettingClick}
          />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => {
  const fileSettings = state.org.present.get('fileSettings', List());
  const existingSettings = fileSettings.map((setting) => setting.get('path'));
  const paths = state.org.present.get('files', List()).keySeq();
  const loadedFilepaths = paths
    .filter((path) => !path.startsWith(STATIC_FILE_PREFIX))
    .filter((path) => !existingSettings.find((settingPath) => settingPath === path))
    .toJS();
  return {
    fileSettings,
    loadedFilepaths,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FileSettingsEditor);
