import React, { PureComponent, Fragment } from 'react';

import './CaptureTemplate.css';

import ActionButton from '../../../OrgFile/components/ActionDrawer/components/ActionButton';
import Switch from '../../../UI/Switch/';

import _ from 'lodash';

export default class CaptureTemplate extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'toggleAvailabilityInAllOrgFiles',
      'handleAddNewOrgFileAvailability',
    ]);
  }

  componentDidUpdate(prevProps) {
    const prevTemplate = prevProps.template;
    const { template } = this.props;

    if (prevTemplate.get('orgFilesWhereAvailable').size === template.get('orgFilesWhereAvailable').size - 1) {
      this.lastOrgFileAvailabilityField.focus();
    } else if (prevTemplate.get('isAvailableInAllOrgFiles') && !template.get('isAvailableInAllOrgFiles')) {
      this.lastOrgFileAvailabilityField.focus();
    }
  }

  updateField(fieldName) {
    return event => this.props.onFieldPathUpdate(this.props.template.get('id'), [fieldName], event.target.value);
  }

  toggleAvailabilityInAllOrgFiles() {
    const { template, onFieldPathUpdate } = this.props;
    onFieldPathUpdate(template.get('id'), ['isAvailableInAllOrgFiles'], !template.get('isAvailableInAllOrgFiles'));
  }

  handleAddNewOrgFileAvailability() {
    this.props.onAddNewTemplateOrgFileAvailability(this.props.template.get('id'));
  }

  handleRemoveOrgFileAvailability(index) {
    return () => this.props.onRemoveTemplateOrgFileAvailability(this.props.template.get('id'), index);
  }

  handleOrgFileAvailabilityChange(orgFileAvailabilityIndex) {
    return event => this.props.onFieldPathUpdate(this.props.template.get('id'),
                                                 ['orgFilesWhereAvailable', orgFileAvailabilityIndex],
                                                 event.target.value);
  }

  render() {
    const { template } = this.props;

    return (
      <div className="capture-template-container">
        <div className="capture-template__field-container">
          <div className="capture-template__field">
            <div>Description:</div>
            <input type="text"
                   className="textfield"
                   value={template.get('description', '')}
                   onChange={this.updateField('description')} />
          </div>
        </div>

        <div className="capture-template__field-container">
          <div className="capture-template__field">
            <div>Letter:</div>
            <input type="text"
                   className="textfield capture-template__letter-textfield"
                   maxLength="1"
                   value={template.get('letter', '')}
                   onChange={this.updateField('letter')}
                   autoCapitalize="none" />
          </div>

          <div className="capture-template__field__or-container">
            <div className="capture-template__field__or-line" />
            <div className="capture-template__field__or">or</div>
            <div className="capture-template__field__or-line" />
          </div>

          <div className="capture-template__field">
            <div>Icon name:</div>
            <input type="text"
                   className="textfield"
                   value={template.get('iconName')}
                   onChange={this.updateField('iconName')}
                   autoCapitalize="none"
                   autoCorrect="none" />
          </div>

          <div className="capture-template__help-text">
            Instead of a letter, you can specify the name of any free Font Awesome icon (like lemon or calendar-plus) to use as the capture icon.
            {' '}You can search the available icons <a href="https://fontawesome.com/icons?d=gallery&s=solid&m=free" target="_blank" rel="noopener noreferrer">here</a>.
          </div>

          <div className="capture-template__field" style={{marginTop: 10}}>
            <div>Preview:</div>
            <ActionButton iconName={template.get('iconName')} letter={template.get('letter')} onClick={() => {}} />
          </div>
        </div>

        <div className="capture-template__field-container">
          <div className="capture-template__field">
            <div>Available in all org files?</div>
            <Switch isEnabled={template.get('isAvailableInAllOrgFiles')}
                    onToggle={this.toggleAvailabilityInAllOrgFiles} />
          </div>

          <div className="capture-template__help-text">
            You can make this capture template available in all org files, or just the ones you specify.
            Specify full paths starting from the root of your Dropbox, like <code>/org/todo.org</code>
          </div>

          {!template.get('isAvailableInAllOrgFiles') && (
            <Fragment>
              <div className="org-files-availability-container">
                {template.get('orgFilesWhereAvailable').map((orgFilePath, index) => (
                  <div key={`org-file-availability-${index}`}
                       className="org-file-availability-container">
                    <input type="text"
                           placeholder="e.g., /org/todo.org"
                           className="textfield org-file-availability-field"
                           value={orgFilePath}
                           onChange={this.handleOrgFileAvailabilityChange(index)}
                           ref={input => this.lastOrgFileAvailabilityField = input} />
                      <button className="fas fa-times fa-lg remove-org-file-availability-button"
                              onClick={this.handleRemoveOrgFileAvailability(index)} />
                  </div>
                ))}
              </div>

              <div className="add-new-org-file-availability-button-container">
                <button className="fas fa-plus add-new-org-file-availability-button"
                        onClick={this.handleAddNewOrgFileAvailability} />
              </div>
            </Fragment>
          )}
        </div>
      </div>
    );
  }
}
