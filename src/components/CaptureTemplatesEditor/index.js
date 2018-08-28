import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './CaptureTemplatesEditor.css';

import * as captureActions from '../../actions/capture';

import CaptureTemplate from './components/CaptureTemplate';
import CaptureTemplateDragPreview from './components/CaptureTemplateDragPreview';

import { List } from 'immutable';
import _ from 'lodash';

class CaptureTemplatesEditor extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleAddNewTemplateClick',
      'handleFieldPathUpdate',
      'handleAddNewTemplateOrgFileAvailability',
      'handleRemoveTemplateOrgFileAvailability',
      'handleAddNewTemplateHeaderPath',
      'handleRemoveTemplateHeaderPath',
      'handleDeleteTemplate',
      'handleReorderTemplate',
    ]);
  }

  handleAddNewTemplateClick() {
    this.props.capture.addNewEmptyCaptureTemplate();
  }

  handleFieldPathUpdate(templateId, fieldPath, newValue) {
    this.props.capture.updateTemplateFieldPathValue(templateId, fieldPath, newValue);
  }

  handleAddNewTemplateOrgFileAvailability(templateId) {
    this.props.capture.addNewTemplateOrgFileAvailability(templateId);
  }

  handleRemoveTemplateOrgFileAvailability(templateId, orgFileAvailabilityIndex) {
    this.props.capture.removeTemplateOrgFileAvailability(templateId, orgFileAvailabilityIndex);
  }

  handleAddNewTemplateHeaderPath(templateId) {
    this.props.capture.addNewTemplateHeaderPath(templateId);
  }

  handleRemoveTemplateHeaderPath(templateId, headerPathIndex) {
    this.props.capture.removeTemplateHeaderPath(templateId, headerPathIndex);
  }

  handleDeleteTemplate(templateId) {
    this.props.capture.deleteTemplate(templateId);
  }

  handleReorderTemplate(fromIndex, toIndex) {
    this.props.capture.reorderCaptureTemplate(fromIndex, toIndex);
  }

  render() {
    const { captureTemplates } = this.props;

    return (
      <div>
        <div className="capture-templates-container">
          {captureTemplates.size === 0 ? (
            <div className="no-capture-templates-message">
              You don't currently have any capture templates - add one by pressing the <i className="fas fa-plus" /> button.

              <br />
              <br />

              Capture templates show up in the action drawer and give you quick access to creating new headers (like org-capture).
            </div>
          ) : (
            <Fragment>
              {captureTemplates.map((template, index) => (
                <CaptureTemplate key={template.get('id')}
                                 index={index}
                                 template={template}
                                 onFieldPathUpdate={this.handleFieldPathUpdate}
                                 onAddNewTemplateOrgFileAvailability={this.handleAddNewTemplateOrgFileAvailability}
                                 onRemoveTemplateOrgFileAvailability={this.handleRemoveTemplateOrgFileAvailability}
                                 onAddNewTemplateHeaderPath={this.handleAddNewTemplateHeaderPath}
                                 onRemoveTemplateHeaderPath={this.handleRemoveTemplateHeaderPath}
                                 onDeleteTemplate={this.handleDeleteTemplate}
                                 onReorder={this.handleReorderTemplate} />
              ))}

              {window.deviceHasTouchSupport && <CaptureTemplateDragPreview />}
            </Fragment>
          )}
        </div>

        <div className="new-capture-template-button-container">
          <button className="fas fa-plus fa-lg btn btn--circle" onClick={this.handleAddNewTemplateClick} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    captureTemplates: state.capture.get('captureTemplates', new List()),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    capture: bindActionCreators(captureActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CaptureTemplatesEditor);
