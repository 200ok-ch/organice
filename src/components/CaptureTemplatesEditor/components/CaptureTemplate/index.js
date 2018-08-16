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
      'handleAddNewHeaderPath',
    ]);
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

  handleAddNewHeaderPath() {
    this.props.onAddNewTemplateHeaderPath(this.props.template.get('id'));
  }

  handleRemoveHeaderPath(headerPathIndex) {
    return () => this.props.onRemoveTemplateHeaderPath(this.props.template.get('id'), headerPathIndex);
  }

  handleHeaderPathChange(headerPathIndex) {
    return event => this.props.onFieldPathUpdate(this.props.template.get('id'),
                                                 ['headerPaths', headerPathIndex],
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
              <div className="multi-textfields-container">
                {template.get('orgFilesWhereAvailable').map((orgFilePath, index) => (
                  <div key={`org-file-availability-${index}`}
                       className="multi-textfield-container">
                    <input type="text"
                           placeholder="e.g., /org/todo.org"
                           className="textfield multi-textfield-field"
                           value={orgFilePath}
                           onChange={this.handleOrgFileAvailabilityChange(index)} />
                      <button className="fas fa-times fa-lg remove-multi-textfield-button"
                              onClick={this.handleRemoveOrgFileAvailability(index)} />
                  </div>
                ))}
              </div>

              <div className="add-new-multi-textfield-button-container">
                <button className="fas fa-plus add-new-multi-textfield-button"
                        onClick={this.handleAddNewOrgFileAvailability} />
              </div>
            </Fragment>
          )}
        </div>

        <div className="capture-template__field-container">
          <div className="capture-template__field" style={{marginTop: 7}}>
            <div>Header path</div>
          </div>

          <div className="capture-template__help-text">
            Specify the path to the header under which the new header should be filed.
            One header per textfield.
          </div>

          <div className="multi-textfields-container">
            {template.get('headerPaths').map((headerPath, index) => (
              <div key={`header-path-${index}`}
                   className="multi-textfield-container">
                <input type="text"
                       placeholder="e.g., Todos"
                       className="textfield multi-textfield-field"
                       value={headerPath}
                       onChange={this.handleHeaderPathChange(index)} />
                  <button className="fas fa-times fa-lg remove-multi-textfield-button"
                          onClick={this.handleRemoveHeaderPath(index)} />
              </div>
            ))}
          </div>

          <div className="add-new-multi-textfield-button-container">
            <button className="fas fa-plus add-new-multi-textfield-button"
                    onClick={this.handleAddNewHeaderPath} />
          </div>
        </div>
      </div>
    );
  }
}
