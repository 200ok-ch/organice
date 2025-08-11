import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { is } from 'immutable';
import { curry } from 'lodash/fp';
import AttributedString from '../../AttributedString';
import TableCellEditContainer from '../TableCellEditContainer/index';
import { getTableCell } from '../../../../../lib/org_utils';
import { activatePopup } from '../../../../../actions/base';
import { setSelectedTableCellId, advanceCheckboxState } from '../../../../../actions/org';
import './stylesheet.css';

const getInTableEditMode = curry(
  (filePath, state) => state.org.present.getIn(['files', filePath, 'editMode']) === 'table'
);
const getSelectedCellId = curry((filePath, state) => {
  return state.org.present.getIn(['files', filePath, 'selectedTableCellId']);
});
const TableCell = ({
  props: { filePath, headerIndex, descriptionItemIndex, cellId, row, column },
}) => {
  const dispatch = useDispatch();
  const inTableEditMode = useSelector(getInTableEditMode(filePath));
  const selectedCellId = useSelector(getSelectedCellId(filePath));

  const [isCellSelected, setIsCellSelected] = useState(cellId === selectedCellId);

  const tableCellGetter = getTableCell({
    filePath,
    headerIndex,
    descriptionItemIndex,
    row,
    column,
  });
  const cell = useSelector(tableCellGetter, is);
  const cellContents = cell.get('contents');
  const cellRawContents = cell.get('rawContents');

  useEffect(() => {
    if (cellId == selectedCellId) {
      setIsCellSelected(true);
    } else {
      setIsCellSelected(false);
    }
  }, [selectedCellId, isCellSelected, cellId]);

  const className = classNames('table-part__cell', {
    'table-part__cell--selected': isCellSelected,
  });

  const handleCellSelect = () => {
    setIsCellSelected(true);
    dispatch(setSelectedTableCellId(cellId));
  };

  const handleCheckboxClick = (listItemId) => {
    dispatch(advanceCheckboxState(listItemId));
  };

  const handleTimestampClick = (timestampId) => {
    dispatch(activatePopup('timestamp-editor', { timestampId }));
  };

  const subPartDataAndHandlers = {
    inTableEditMode: inTableEditMode,
    onCheckboxClick: handleCheckboxClick,
    onTimestampClick: handleTimestampClick,
  };

  return (
    <td className={className} key={cellId} onClick={handleCellSelect}>
      {isCellSelected && inTableEditMode ? (
        <TableCellEditContainer cellValue={cellRawContents} cellId={cellId} />
      ) : (
        <AttributedString parts={cellContents} subPartDataAndHandlers={subPartDataAndHandlers} />
      )}
    </td>
  );
};

export default TableCell;
