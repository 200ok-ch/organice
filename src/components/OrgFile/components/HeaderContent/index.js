import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './HeaderContent.css';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';

import AttributedString from '../AttributedString';

class HeaderContent extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleDescriptionChange','handleTextareaBlur']);

    this.state = {
      descriptionValue: props.header.get('rawDescription'),
    };
  }

  componentWillReceiveProps(nextProps) {
    const { header } = this.props;

    if (this.props.inEditMode && !nextProps.inEditMode) {
      this.props.org.updateHeaderDescription(header.get('id'), this.state.descriptionValue);
    }

    this.setState({ descriptionValue: nextProps.header.get('rawDescription') });
  }

  handleDescriptionChange(event) {
    this.setState({ descriptionValue: event.target.value });
  }

  handleTextareaBlur() {
    this.props.org.exitDescriptionEditMode();
  }

  render() {
    const { header, inEditMode } = this.props;

    if (!header.get('opened')) {
      return <div></div>;
    }

    return (
      <div>
        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="*"
                    value={this.state.descriptionValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleDescriptionChange} />
        ) : (
          <AttributedString parts={header.get('description')} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode: (
      state.org.get('inDescriptionEditMode') && state.org.get('selectedHeaderId') === props.header.get('id')
    ),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
