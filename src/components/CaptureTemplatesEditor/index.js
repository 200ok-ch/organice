import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Droppable } from 'react-beautiful-dnd';

import './stylesheet.css';

import * as captureActions from '../../actions/capture';

import CaptureTemplate from './components/CaptureTemplate';

import { List } from 'immutable';

const CaptureTemplatesEditor = ({ captureTemplates, syncBackendType, capture }) => {
  const handleAddNewTemplateClick = () => capture.addNewEmptyCaptureTemplate();

  const handleFieldPathUpdate = (templateId, fieldPath, newValue) =>
    capture.updateTemplateFieldPathValue(templateId, fieldPath, newValue);

  const handleAddNewTemplateOrgFileAvailability = templateId =>
    capture.addNewTemplateOrgFileAvailability(templateId);

  const handleRemoveTemplateOrgFileAvailability = (templateId, orgFileAvailabilityIndex) =>
    capture.removeTemplateOrgFileAvailability(templateId, orgFileAvailabilityIndex);

  const handleAddNewTemplateHeaderPath = templateId => capture.addNewTemplateHeaderPath(templateId);

  const handleRemoveTemplateHeaderPath = (templateId, headerPathIndex) =>
    capture.removeTemplateHeaderPath(templateId, headerPathIndex);

  const handleDeleteTemplate = templateId => capture.deleteTemplate(templateId);

  const handleReorderTemplate = (fromIndex, toIndex) =>
    capture.reorderCaptureTemplate(fromIndex, toIndex);

  return (
    <div>
      <Droppable droppableId="capture-templates-editor-droppable" type="CAPTURE-TEMPLATE">
        {(provided, snapshot) => (
          <div
            className="capture-templates-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {captureTemplates.size === 0 ? (
              <div className="no-capture-templates-message">
                You don't currently have any capture templates - add one by pressing the{' '}
                <i className="fas fa-plus" /> button.
                <br />
                <br />
                Capture templates show up in the action drawer and give you quick access to creating
                new headers (like org-capture).
              </div>
            ) : (
              <Fragment>
                {captureTemplates.map((template, index) => (
                  <CaptureTemplate
                    key={template.get('id')}
                    index={index}
                    template={template}
                    syncBackendType={syncBackendType}
                    onFieldPathUpdate={handleFieldPathUpdate}
                    onAddNewTemplateOrgFileAvailability={handleAddNewTemplateOrgFileAvailability}
                    onRemoveTemplateOrgFileAvailability={handleRemoveTemplateOrgFileAvailability}
                    onAddNewTemplateHeaderPath={handleAddNewTemplateHeaderPath}
                    onRemoveTemplateHeaderPath={handleRemoveTemplateHeaderPath}
                    onDeleteTemplate={handleDeleteTemplate}
                    onReorder={handleReorderTemplate}
                  />
                ))}

                {provided.placeholder}
              </Fragment>
            )}
          </div>
        )}
      </Droppable>

      <div className="new-capture-template-button-container">
        <button className="fas fa-plus fa-lg btn btn--circle" onClick={handleAddNewTemplateClick} />
      </div>
    </div>
  );
};

const mapStateToProps = (state, props) => {
  return {
    captureTemplates: state.capture.get('captureTemplates', List()),
    syncBackendType: state.syncBackend.get('client').type,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    capture: bindActionCreators(captureActions, dispatch),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CaptureTemplatesEditor);
