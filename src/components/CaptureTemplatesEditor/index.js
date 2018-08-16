import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './CaptureTemplatesEditor.css';

import * as captureActions from '../../actions/capture';

import CaptureTemplate from './components/CaptureTemplate';

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

  render() {
    const { captureTemplates } = this.props;

    return (
      <div>
        <div>
          {captureTemplates.map(template => (
            <CaptureTemplate key={template.get('id')}
                             template={template}
                             onFieldPathUpdate={this.handleFieldPathUpdate}
                             onAddNewTemplateOrgFileAvailability={this.handleAddNewTemplateOrgFileAvailability}
                             onRemoveTemplateOrgFileAvailability={this.handleRemoveTemplateOrgFileAvailability}
                             onAddNewTemplateHeaderPath={this.handleAddNewTemplateHeaderPath}
                             onRemoveTemplateHeaderPath={this.handleRemoveTemplateHeaderPath} />
          ))}
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
