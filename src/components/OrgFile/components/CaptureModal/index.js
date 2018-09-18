import React, { PureComponent, Fragment } from 'react';

import './CaptureModal.css';

import ActionButton from '../ActionDrawer/components/ActionButton/';
import Switch from '../../../UI/Switch/';
import Popup from '../../../UI/Popup/';

import { headerWithPath } from '../../../../lib/org_utils';
import substituteTemplateVariables from '../../../../lib/capture_template_substitution';

import _ from 'lodash';

export default class CaptureModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleCaptureClick',
      'handleTextareaChange',
      'handleCloseClick',
      'handlePrependSwitchToggle',
    ]);

    const [substitutedTemplate, initialCursorIndex] = substituteTemplateVariables(props.template.get('template'));

    this.state = {
      textareaValue: substitutedTemplate,
      initialCursorIndex,
      shouldPrepend: props.template.get('shouldPrepend'),
    };
  }

  componentDidMount() {
    const { initialCursorIndex } = this.state;

    if (this.textarea) {
      this.textarea.focus();
      if (initialCursorIndex !== null) {
        this.textarea.selectionStart = initialCursorIndex;
        this.textarea.selectionEnd = initialCursorIndex;
      }
    }
  }

  handleCaptureClick() {
    const { textareaValue, shouldPrepend } = this.state;
    const { template, onCapture } = this.props;

    onCapture(template.get('id'), textareaValue, shouldPrepend);
  }

  handleTextareaChange(event) {
    this.setState({ textareaValue: event.target.value });
  }

  handleCloseClick() {
    this.props.onClose();
  }

  handlePrependSwitchToggle() {
    this.setState({ shouldPrepend: !this.state.shouldPrepend });
  }

  render() {
    const { template, headers } = this.props;
    const { textareaValue, shouldPrepend } = this.state;

    const targetHeader = headerWithPath(headers, template.get('headerPaths'));

    return (
      <Popup shouldIncludeCloseButton onClose={this.handleCloseClick}>
        <div className="capture-modal-header">
          <ActionButton letter={template.get('letter')}
                        iconName={template.get('iconName')}
                        isDisabled={false}
                        onClick={() => {}}
                        style={{marginRight: 20}} />

          <span>{template.get('description')}</span>
        </div>

        <div className="capture-modal-header-path">
          {template.get('headerPaths').join(' > ')}
        </div>

        {!!targetHeader ? (
          <Fragment>
            <textarea className="textarea capture-modal-textarea"
                      rows="4"
                      value={textareaValue}
                      onChange={this.handleTextareaChange}
                      ref={textarea => this.textarea = textarea} />

            <div className="capture-modal-button-container">
              <div className="capture-modal-prepend-container">
                <span className="capture-modal-prepend-label">Prepend:</span>
                <Switch isEnabled={shouldPrepend} onToggle={this.handlePrependSwitchToggle} />
              </div>

              <button className="btn capture-modal-button" onClick={this.handleCaptureClick}>
                Capture
              </button>
            </div>
          </Fragment>
        ) : (
          <div className="capture-modal-error-message">
            The specified header path doesn't exist in this org file!
          </div>
        )}
      </Popup>
    );
  }
}
