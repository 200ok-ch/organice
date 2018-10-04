import React, { PureComponent, Fragment } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import './stylesheet.css';

import AttributedString from '../../../AttributedString';
import TableActionDrawer from './TableActionDrawer';

import { getCurrentTimestampAsText } from '../../../../../../lib/timestamps';

import _ from 'lodash';
import classNames from 'classnames';
import { Map } from 'immutable';

export default class TablePart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'handleCellSelect',
      'handleTextareaBlur',
      'handleCellChange',
      'handleInsertTimestamp',
      'handleTextareaRef',
    ]);

    this.state = {
      rawCellValues: this.generateCellValueMap(props.table),
      shouldIgnoreBlur: false,
    };
  }

  componentDidUpdate(prevProps) {
    const {
      subPartDataAndHandlers: { onTableCellValueUpdate, selectedTableCellId, inTableEditMode },
    } = this.props;
    const { rawCellValues } = this.state;

    if (prevProps.subPartDataAndHandlers.inTableEditMode && !inTableEditMode) {
      if (rawCellValues.has(selectedTableCellId)) {
        onTableCellValueUpdate(selectedTableCellId, rawCellValues.get(selectedTableCellId));
      }
    }

    if (this.props.table !== prevProps.table) {
      this.setState({ rawCellValues: this.generateCellValueMap(this.props.table) });
    }
  }

  generateCellValueMap(table) {
    return Map(
      table
        .get('contents')
        .map(row => row.get('contents').map(cell => [cell.get('id'), cell.get('rawContents')]))
        .flatten()
    );
  }

  handleCellSelect(cellId) {
    return () => this.props.subPartDataAndHandlers.onTableCellSelect(cellId);
  }

  handleTextareaBlur() {
    setTimeout(() => {
      if (!this.state.shouldIgnoreBlur) {
        this.props.subPartDataAndHandlers.onExitTableEditMode();
      } else {
        this.setState({ shouldIgnoreBlur: false });
      }
    }, 0);
  }

  handleCellChange(event) {
    const { rawCellValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedTableCellId },
    } = this.props;

    this.setState({
      rawCellValues: rawCellValues.set(selectedTableCellId, event.target.value),
    });
  }

  handleInsertTimestamp() {
    // Clicking this button will unfocus the textarea, but we don't want to exit edit mode,
    // so instruct the blur handler to ignore the event.
    this.setState({ shouldIgnoreBlur: true });

    const { rawCellValues } = this.state;
    const {
      subPartDataAndHandlers: { selectedTableCellId },
    } = this.props;
    const cellValue = rawCellValues.get(selectedTableCellId);

    const insertionIndex = this.textarea.selectionStart;
    this.setState({
      rawCellValues: rawCellValues.set(
        selectedTableCellId,
        cellValue.substring(0, insertionIndex) +
          getCurrentTimestampAsText() +
          cellValue.substring(this.textarea.selectionEnd || insertionIndex)
      ),
    });

    this.textarea.focus();
  }

  handleTextareaRef(textarea) {
    this.textarea = textarea;
  }

  render() {
    const {
      table,
      subPartDataAndHandlers: { selectedTableCellId, inTableEditMode, shouldDisableActions },
    } = this.props;
    const { rawCellValues } = this.state;

    const isTableSelected = table
      .get('contents')
      .some(row => row.get('contents').some(cell => cell.get('id') === selectedTableCellId));

    return (
      <Fragment>
        <table className="table-part">
          <tbody>
            {table.get('contents').map(row => (
              <tr key={row.get('id')}>
                {row.get('contents').map(cell => {
                  const isCellSelected = cell.get('id') === selectedTableCellId;

                  const className = classNames('table-part__cell', {
                    'table-part__cell--selected': isCellSelected,
                  });

                  return (
                    <td
                      className={className}
                      key={cell.get('id')}
                      onClick={this.handleCellSelect(cell.get('id'))}
                    >
                      {isCellSelected && inTableEditMode ? (
                        <div className="table-cell__edit-container">
                          <textarea
                            autoFocus
                            className="textarea"
                            rows="3"
                            value={rawCellValues.get(cell.get('id'))}
                            onBlur={this.handleTextareaBlur}
                            onChange={this.handleCellChange}
                            ref={this.handleTextareaRef}
                          />
                          <div
                            className="table-cell__insert-timestamp-button"
                            onClick={this.handleInsertTimestamp}
                          >
                            <i className="fas fa-plus insert-timestamp-icon" />
                            Insert timestamp
                          </div>
                        </div>
                      ) : cell.get('contents').size > 0 ? (
                        <AttributedString
                          parts={cell.get('contents')}
                          subPartDataAndHandlers={this.props.subPartDataAndHandlers}
                        />
                      ) : (
                        '   '
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <Collapse isOpened={isTableSelected && !shouldDisableActions}>
          <TableActionDrawer subPartDataAndHandlers={this.props.subPartDataAndHandlers} />
        </Collapse>
      </Fragment>
    );
  }
}
