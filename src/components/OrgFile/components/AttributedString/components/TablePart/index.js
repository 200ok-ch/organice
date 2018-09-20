import React, { PureComponent, Fragment } from 'react';
import { UnmountClosed as Collapse } from 'react-collapse';

import AttributedString from '../../../AttributedString';
import TableActionDrawer from './TableActionDrawer';

import './TablePart.css';

import _ from 'lodash';
import classNames from 'classnames';
import { Map } from 'immutable';

export default class TablePart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleCellSelect', 'handleTextareaBlur', 'handleCellChange']);

    this.state = {
      rawCellValues: this.generateCellValueMap(props.table),
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
    this.props.subPartDataAndHandlers.onExitTableEditMode();
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
                        <textarea
                          autoFocus
                          className="textarea"
                          rows="3"
                          value={rawCellValues.get(cell.get('id'))}
                          onBlur={this.handleTextareaBlur}
                          onChange={this.handleCellChange}
                        />
                      ) : cell.get('contents').size > 0 ? (
                        <AttributedString parts={cell.get('contents')} />
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
