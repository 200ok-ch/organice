import React, { PureComponent } from 'react';

import './CaptureModal.css';

import ActionButton from '../ActionDrawer/components/ActionButton/';

import _ from 'lodash';
import moment from 'moment';

export default class CaptureModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCaptureClick', 'handleTextareaChange']);

    const [substitutedTemplate, initialCursorIndex] = this.substituteTemplateVariables(props.template.get('template'));

    this.state = {
      textareaValue: substitutedTemplate,
      initialCursorIndex,
    };
  }

  componentDidMount() {
    const { initialCursorIndex } = this.state;

    this.textarea.focus();
    if (initialCursorIndex !== null) {
      this.textarea.selectionStart = initialCursorIndex;
      this.textarea.selectionEnd = initialCursorIndex;
    }
  }

  handleCaptureClick() {
    const { textareaValue } = this.state;
    const { template, onCapture } = this.props;

    onCapture(template.get('id'), textareaValue);
  }

  handleTextareaChange(event) {
    this.setState({ textareaValue: event.target.value });
  }

  substituteTemplateVariables(templateString) {
    if (!templateString) {
      return ['', null];
    }

    const substitutions = {
      '%t' : `<${moment().format('YYYY-MM-DD ddd')}>`,
      '%T' : `<${moment().format('YYYY-MM-DD ddd HH:mm')}>`,
      '%u' : `[${moment().format('YYYY-MM-DD ddd')}]`,
      '%U' : `[${moment().format('YYYY-MM-DD ddd HH:mm')}]`,
    };

    let substitutedString = templateString;
    _.entries(substitutions).forEach(([formatString, value]) => (
      substitutedString = substitutedString.replace(RegExp(formatString, 'g'), value)
    ));

    const cursorIndex = substitutedString.includes('%?') ? substitutedString.indexOf('%?') : null;
    substitutedString = substitutedString.replace(/\%\?/, '');

    return [substitutedString, cursorIndex];
  }

  render() {
    const { template } = this.props;
    const { textareaValue } = this.state;

    return (
      <div className="capture-modal-container">
        <div className="capture-modal-header">
          <ActionButton letter={template.get('letter')}
                        iconName={template.get('iconName')}
                        isDisabled={false}
                        onClick={() => {}} />

          <span>{template.get('description')}</span>
        </div>

        <div className="capture-modal-header-path">
          {template.get('headerPaths').join(' > ')}
        </div>

        <textarea className="textarea capture-modal-textarea"
                  rows="4"
                  value={textareaValue}
                  onChange={this.handleTextareaChange}
                  ref={textarea => this.textarea = textarea} />

        <div className="capture-modal-button-container">
          <button className="btn capture-modal-button" onClick={this.handleCaptureClick}>
            Capture
          </button>
        </div>
      </div>
    );
  }
}
