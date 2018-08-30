import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './HeaderContent.css';

import _ from 'lodash';
import classNames from 'classnames';

import * as orgActions from '../../../../actions/org';

import AttributedString from '../AttributedString';

class HeaderContent extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleRef',
      'handleDescriptionChange',
      'handleTextareaBlur',
      'handleTableCellSelect',
      'handleExitTableEditMode',
      'handleTableCellValueUpdate',
      'handleCheckboxClick',
      'handleEditDescriptionClick',
    ]);

    this.state = {
      descriptionValue: props.header.get('rawDescription'),
      containerWidth: null,
    };
  }

  storeContainerWidth() {
    if (this.containerDiv) {
      this.setState({ containerWidth: this.containerDiv.offsetWidth });
    }
  }

  componentDidMount() {
    this.storeContainerWidth();
  }

  componentWillReceiveProps(nextProps) {
    const { header } = this.props;

    if (this.props.inEditMode && !nextProps.inEditMode) {
      this.props.org.updateHeaderDescription(header.get('id'), this.state.descriptionValue);
    }

    this.setState({
      descriptionValue: nextProps.header.get('rawDescription')
    }, () => this.storeContainerWidth());
  }

  handleRef(div) {
    this.containerDiv = div;
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

  handleCheckboxClick(listItemId) {
    this.props.org.advanceCheckboxState(listItemId);
  }

  handleEditDescriptionClick() {
    this.props.org.enterDescriptionEditMode();
  }

  render() {
    const { header, inEditMode, selectedTableCellId, inTableEditMode, isSelected } = this.props;
    const { containerWidth } = this.state;

    if (!header.get('opened')) {
      return <div></div>;
    }

    const className = classNames('header-content-container', 'nice-scroll', {
      'header-content-container--selected': isSelected
    });

    return (
      <div className={className}
           ref={this.handleRef}
           style={{width: containerWidth}}>
        {inEditMode ? (
          <textarea autoFocus
                    className="textarea"
                    rows="8"
                    value={this.state.descriptionValue}
                    onBlur={this.handleTextareaBlur}
                    onChange={this.handleDescriptionChange} />
        ) : (
          <Fragment>
            {(header.get('description').isEmpty() && isSelected) && (
              <i className="fas fa-edit fa-lg header-content__edit-icon"
                 onClick={this.handleEditDescriptionClick} />
            )}
            <AttributedString parts={header.get('description')}
                              subPartDataAndHandlers={{
                                onTableCellSelect: this.handleTableCellSelect,
                                selectedTableCellId: selectedTableCellId,
                                inTableEditMode: inTableEditMode,
                                onExitTableEditMode: this.handleExitTableEditMode,
                                onTableCellValueUpdate: this.handleTableCellValueUpdate,
                                onCheckboxClick: this.handleCheckboxClick,
                              }} />
          </Fragment>
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
    isSelected: state.org.present.get('selectedHeaderId') === props.header.get('id'),
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
