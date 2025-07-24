import React, { PureComponent, Fragment } from 'react';

import './stylesheet.css';

import AttributedString from '../../../AttributedString';

import _ from 'lodash';
import classNames from 'classnames';
import { Map } from 'immutable';

export default class TablePart extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['handleTableSelect']);

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
        .map((row) => row.get('contents').map((cell) => [cell.get('id'), cell.get('rawContents')]))
        .flatten()
    );
  }

  handleTableSelect(tableId) {
    this.props.subPartDataAndHandlers.onTableSelect(tableId, this.props.descriptionItemIndex);
  }

  render() {
    const { table } = this.props;
    return (
      <Fragment>
        <table className="table-part" onClick={() => this.handleTableSelect(table.get('id'))}>
          <tbody>
            {table.get('contents').map((row) => (
              <tr key={row.get('id')}>
                {row.get('contents').map((cell) => {
                  const className = classNames('table-part__cell');
                  return (
                    <td className={className} key={cell.get('id')}>
                      {cell.get('contents').size > 0 ? (
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
      </Fragment>
    );
  }
}
