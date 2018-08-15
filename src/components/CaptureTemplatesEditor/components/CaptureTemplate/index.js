import React, { PureComponent } from 'react';

import './CaptureTemplate.css';

import ActionButton from '../../../OrgFile/components/ActionDrawer/components/ActionButton';

import _ from 'lodash';

export default class CaptureTemplate extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, []);
  }

  updateField(fieldName) {
    return event => this.props.onFieldUpdate(this.props.template.get('id'), fieldName, event.target.value);
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

        <div className="capture-template__field">
          <div>Description:</div>
          <input type="text" className="textfield" />
        </div>
      </div>
    );
  }
}
