import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Droppable } from 'react-beautiful-dnd';

import './stylesheet.css';

import * as orgActions from '../../actions/org';

import FileSetting from './components/FileSetting';

import { List } from 'immutable';

const FileSettingsEditor = ({ fileSettings, org }) => {
  const handleAddNewSettingClick = () => org.addNewEmptyFileSetting();

  const handleFieldPathUpdate = (settingId, fieldPath, newValue) =>
    org.updateFileSettingFieldPathValue(settingId, fieldPath, newValue);

  const handleDeleteSetting = (settingId) => org.deleteFileSetting(settingId);

  const handleReorderSetting = (fromIndex, toIndex) => org.reorderFileSetting(fromIndex, toIndex);

  return (
    <div>
      <Droppable droppableId="capture-templates-editor-droppable" type="CAPTURE-TEMPLATE">
        {(provided) => (
          <div
            className="capture-templates-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {fileSettings.size === 0 ? (
              <div className="no-capture-templates-message">
                You don't currently have any file settings - add one by pressing the{' '}
                <i className="fas fa-plus" /> button.
                <br />
                <br />
                File settings allow you to configure how specific files are handeled when multiple
                files are loaded.
              </div>
            ) : (
              <Fragment>
                {fileSettings.map((setting, index) => (
                  <FileSetting
                    key={setting.get('id')}
                    index={index}
                    setting={setting}
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

      <div className="new-capture-template-button-container">
        <button className="fas fa-plus fa-lg btn btn--circle" onClick={handleAddNewSettingClick} />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    fileSettings: state.org.present.get('fileSettings', List()),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(FileSettingsEditor);
