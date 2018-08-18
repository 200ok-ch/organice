import React, { PureComponent } from 'react';

import './CaptureModal.css';

import ActionButton from '../ActionDrawer/components/ActionButton/';

import _ from 'lodash';

export default class CaptureModal extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCaptureClick', 'handleTextareaChange']);

    this.state = {
      textareaValue: '',
    };
  }

  handleCaptureClick() {
    const { textareaValue } = this.state;
    const { template, onCapture } = this.props;

    onCapture(template.get('id'), textareaValue);
  }

  handleTextareaChange(event) {
    this.setState({ textareaValue: event.target.value });
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
                  autoFocus
                  value={textareaValue}
                  onChange={this.handleTextareaChange} />

        <div className="capture-modal-button-container">
          <button className="btn capture-modal-button" onClick={this.handleCaptureClick}>
            Capture
          </button>
        </div>
      </div>
    );
  }
}
