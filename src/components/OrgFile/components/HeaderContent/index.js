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

    _.bindAll(this, [
      'handleDescriptionChange',
      'handleTextareaBlur',
      'handleTableCellSelect',
      'handleExitTableEditMode',
      'handleTableCellValueUpdate',
    ]);

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

  handleTableCellSelect(cellId) {
    this.props.org.setSelectedTableCellId(cellId);
  }

  handleExitTableEditMode() {
    this.props.org.exitTableEditMode();
  }

  handleTableCellValueUpdate(cellId, newValue) {
    this.props.org.updateTableCellValue(cellId, newValue);
  }

  render() {
    const { header, inEditMode, selectedTableCellId, inTableEditMode } = this.props;

    if (!header.get('opened')) {
      return <div></div>;
    }

    return (
      <div className="header-content-container nice-scroll">
        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="8"
                    value={this.state.descriptionValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleDescriptionChange} />
        ) : (
          <AttributedString parts={header.get('description')}
                            onTableCellSelect={this.handleTableCellSelect}
                            selectedTableCellId={selectedTableCellId}
                            inTableEditMode={inTableEditMode}
                            onExitTableEditMode={this.handleExitTableEditMode}
                            onTableCellValueUpdate={this.handleTableCellValueUpdate} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    inEditMode: (
      state.org.present.get('inDescriptionEditMode') && state.org.present.get('selectedHeaderId') === props.header.get('id')
    ),
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    inTableEditMode: state.org.present.get('inTableEditMode'),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    org: bindActionCreators(orgActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
