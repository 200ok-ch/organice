import React, { PureComponent, Fragment } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import './stylesheet.css';

import PlanningItems from './components/PlanningItems';
import PropertyListItems from './components/PropertyListItems';
import LogBookEntries from './components/LogBookEntries';

import _ from 'lodash';

import * as orgActions from '../../../../actions/org';
import * as baseActions from '../../../../actions/base';

import { getCurrentTimestampAsText } from '../../../../lib/timestamps';
import { createRawDescriptionText } from '../../../../lib/export_org';

import AttributedString from '../AttributedString';

class HeaderContent extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleTableSelect',
      'handleCheckboxClick',
      'handleTimestampClick',
      'handleLogEntryTimestampClick',
      'handleInsertTimestamp',
      'handlePlanningItemTimestampClick',
      'handlePropertyListEdit',
    ]);

    this.state = {
      descriptionValue: this.calculateRawDescription(props.header),
      containerWidth: null,
      shouldIgnoreBlur: false,
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

  componentDidUpdate(prevProps) {
    const { header } = this.props;

    if (prevProps.header !== this.props.header) {
      this.setState(
        {
          descriptionValue: this.calculateRawDescription(this.props.header),
        },
        () => this.storeContainerWidth()
      );
    }
  }

  calculateRawDescription(header) {
    // This generates the text that appears in the description text field.
    const dontIndent = this.props.dontIndent;
    return createRawDescriptionText(header, false, dontIndent);
  }

  handleTableSelect(tableId) {
    this.props.org.selectHeader(this.props.header.get('id'));
    this.props.org.setSelectedTableId(tableId);
    this.props.base.activatePopup('table-editor');
  }

  handleCheckboxClick(listItemId) {
    this.props.org.advanceCheckboxState(listItemId);
  }

  handleTimestampClick(timestampId) {
    this.props.base.activatePopup('timestamp-editor', {
      timestampId,
      headerId: this.props.header.get('id'),
    });
  }

  handleLogEntryTimestampClick(headerId) {
    return (logEntryIndex, entryType) =>
      this.props.base.activatePopup('timestamp-editor', {
        headerId,
        logEntryIndex,
        entryType,
      });
  }

  handleInsertTimestamp() {
    // Clicking this button will unfocus the textarea, but we don't want to exit edit mode,
    // so instruct the blur handler to ignore the event.
    this.setState({ shouldIgnoreBlur: true });

    const { descriptionValue } = this.state;
    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      descriptionValue:
        descriptionValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        descriptionValue.substring(this.textarea.selectionEnd || insertionIndex),
    });
    this.textarea.focus();
  }

  handlePlanningItemTimestampClick(headerId) {
    return (planningItemIndex) =>
      this.props.base.activatePopup('timestamp-editor', { headerId, planningItemIndex });
  }

  handlePropertyListEdit() {
    const { header } = this.props;
    this.props.base.activatePopup('property-list-editor', { headerId: header.get('id') });
  }

  render() {
    const { header, shouldDisableActions } = this.props;
    const { containerWidth } = this.state;

    if (!header.get('opened')) {
      return <div />;
    }

    return (
      <div className="header-content-container nice-scroll" style={{ width: containerWidth }}>
        {
          <Fragment>
            <PlanningItems
              planningItems={header.get('planningItems')}
              onClick={this.handlePlanningItemTimestampClick(header.get('id'))}
            />
            <PropertyListItems
              propertyListItems={header.get('propertyListItems')}
              onTimestampClick={this.handleTimestampClick}
              shouldDisableActions={shouldDisableActions}
              onEdit={this.handlePropertyListEdit}
            />
            <AttributedString
              parts={header.get('logNotes')}
              subPartDataAndHandlers={{
                onTimestampClick: this.handleTimestampClick,
                shouldDisableActions,
              }}
            />
            <LogBookEntries
              logBookEntries={header.get('logBookEntries')}
              onTimestampClick={this.handleLogEntryTimestampClick(header.get('id'))}
              shouldDisableActions={shouldDisableActions}
            />
            <AttributedString
              parts={header.get('description')}
              subPartDataAndHandlers={{
                onTableSelect: shouldDisableActions ? undefined : this.handleTableSelect,
                onCheckboxClick: this.handleCheckboxClick,
                onTimestampClick: this.handleTimestampClick,
                shouldDisableActions,
              }}
            />
          </Fragment>
        }
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const path = state.org.present.get('path');
  const file = state.org.present.getIn(['files', path]);
  return {
    isSelected: file.get('selectedHeaderId') === ownProps.header.get('id'),
    dontIndent: state.base.get('shouldNotIndentOnExport'),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContent);
