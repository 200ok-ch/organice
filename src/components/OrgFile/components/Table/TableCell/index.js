import React, {useState, useRef, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames';
import { is, fromJS } from "immutable"
import AttributedString from '../../AttributedString';
import TableCellEditContainer from "../TableCellEditContainer/index"
import { getTableCell } from '../../../../../lib/org_utils';
import { activatePopup } from '../../../../../actions/base';
import {
  setSelectedTableCellId,
  advanceCheckboxState,  
} from '../../../../../actions/org';



const TableCell = ({props: {
  filePath,
  headerIndex,
  descriptionItemIndex,
  cellId,
  row,
  column,  
}}) => {  
  const dispatch = useDispatch();  
  const inTableEditMode = useSelector((state) => state.org.present.getIn(['files', filePath, "editMode"]) === "table");
  const selectedCellId = useSelector((state) => state.org.present.getIn(['files', filePath, "selectedTableCellId"]));
  const [isCellSelected, setIsCellSelected] = useState(cellId === selectedCellId)


  const tableCellGetter = getTableCell({filePath, headerIndex, descriptionItemIndex, row, column})
  const cell = useSelector(tableCellGetter, is)
  const cellContents = cell.get("contents")
  const cellRawContents = cell.get("rawContents")

  const className = classNames('table-part__cell', {
    'table-part__cell--selected': isCellSelected,
  })
  
  const handleCellSelect = () => {
    setIsCellSelected(true)
    dispatch(setSelectedTableCellId(cellId))
  }

  const handleCheckboxClick = (listItemId) => {
    dispatch(advanceCheckboxState(listItemId));
  }

  const handleTimestampClick = (timestampId) => {
    dispatch(activatePopup('timestamp-editor', { timestampId }));
  }

  const subPartDataAndHandlers = {
    inTableEditMode: inTableEditMode,
    onCheckboxClick: handleCheckboxClick,
    onTimestampClick: handleTimestampClick,
  }

  return ( <td
           className={className}
           key={cellId}
           onClick={handleCellSelect}>
	   {isCellSelected && inTableEditMode ? <TableCellEditContainer cellValue={cellRawContents} cellId={cellId}/> : <AttributedString parts={cellContents} subPartDataAndHandlers={subPartDataAndHandlers} />}
	   </td>
  )
  
}

export default TableCell;
