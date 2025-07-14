import React, {useState, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { Map } from 'immutable';

import { getCurrentTimestampAsText } from '../../../../../lib/timestamps';
import { enterEditMode, exitEditMode, updateTableCellValue, setSelectedTableCellId } from '../../../../../actions/org';


const CellEditContainer = ({cellValue, cellId}) => {
  const dispatch = useDispatch()
  const path = useSelector((state) => state.org.present.get("path"))
  const inTableEditMode = useSelector((state) => state.org.present.getIn(['files', path, 'editMode']) === "table");

  
  const [currentCellValue, setCurrentCellValue] = useState(cellValue)
  const [shouldIgnoreBlur, setShouldIgnoreBlur] = useState(false)
  const textareaRef = useRef(null)


  const handleTableCellValueUpdate = (cellId, newValue) => {
    dispatch(updateTableCellValue(cellId, newValue))
  }

  const handleExitTableEditMode = () => {
    dispatch(updateTableCellValue(cellId, currentCellValue))
    dispatch(exitEditMode())
  }
  
  const handleCellChange = (event) => setCurrentCellValue(event.target.value)

  const handleInsertTimestamp = () => {
    setShouldIgnoreBlur(true)
    const insertionIndex = textareaRef.current.selectionStart;
    setCurrentCellValue(
      currentCellValue.substring(0, insertionIndex) +
        getCurrentTimestampAsText() +
        currentCellValue.substring(textareaRef.current.selectionEnd || insertionIndex)
    );

    setShouldIgnoreBlur(false)
    textareaRef.current.focus()
  }

  const handleTextareaBlur = () => {
    if (!shouldIgnoreBlur) {      
      handleExitTableEditMode();
    }
  }
  
    
  return (
    <div className="table-cell__edit-container">
      <textarea
	data-testid="edit-cell-container"
        autoFocus
        className="textarea"
	rows="3"
        value={currentCellValue}
        onChange={handleCellChange}
	onBlur={handleTextareaBlur}
        ref={textareaRef}
      />
      <div
        className="table-cell__insert-timestamp-button"
        onClick={handleInsertTimestamp}>
        <i className="fas fa-plus insert-timestamp-icon" />
	  Insert timestamp
      </div>
    </div>
  );
}
export default CellEditContainer;
