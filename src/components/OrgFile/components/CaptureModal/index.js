import React, { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import {
  isMobileSafari13,
  isRunningAsPWA,
  isInLandscapeMode,
  isIphoneX,
  isIphone678,
} from '../../../../lib/browser_utils';

import './stylesheet.css';

import ActionButton from '../ActionDrawer/components/ActionButton/';
import Switch from '../../../UI/Switch/';

import { headerWithPath } from '../../../../lib/org_utils';
import substituteTemplateVariables from '../../../../lib/capture_template_substitution';

export default ({ template, onCapture, headers }) => {
  const [substitutedTemplate, initialCursorIndex] = useMemo(
    () => substituteTemplateVariables(template.get('template')),
    [template]
  );

  const targetHeader = useMemo(
    () =>
      template.get('headerPaths').size === 0
        ? 'FILE'
        : headerWithPath(headers, template.get('headerPaths')),
    [headers, template]
  );

  const [textareaValue, setTextareaValue] = useState(substitutedTemplate);
  const [shouldPrepend, setShouldPrepend] = useState(template.get('shouldPrepend'));
  const [shouldCaptureAsNewHeader, setShouldCaptureAsNewHeader] = useState(
    !template.has('shouldCaptureAsNewHeader') ||
    template.get('shouldCaptureAsNewHeader')
  );

  /** INFO: Some versions of Mobile Safari do _not_ like it when the
  focus is set without an explicit user interaction. This is the case
  in organice, because the user interaction is on a button which in
  turn opens a textarea which should have the focus. It will open the
  software keyboard, but the capture template will stay on the bottom
  of the view, so it will be hidden by the keyboard. The user would
  have to manually scroll down. On iOS 12, it worked without this
  workaround. Starting with iOS 13.3, the workaround isn't needed,
  anymore. */
  const getMinHeight = () => {
    // Only Mobile Safari needs the shenannigans for moving the input
    // above the software keyboard.
    if (isMobileSafari13) {
      if (isRunningAsPWA) {
        if (isInLandscapeMode()) {
          return '9em';
        } else {
          if (isIphoneX) {
            return '23em';
          } else if (isIphone678) {
            return '19em';
          }
          // For unmeasured models, it's safest to stick with the
          // default iOS behavior - even if the keyboard hides the
          // input field it's better than if it's moved too far up.
          else {
            return 'auto';
          }
        }
      }
      // Portrait mode
      else {
        if (isInLandscapeMode()) {
          return '9em';
        } else {
          if (isIphoneX) {
            return '18em';
          } else if (isIphone678) {
            return '18em';
          } else {
            return 'auto';
          }
        }
      }
    } else {
      return 'auto';
    }
  };

  const textarea = useRef(null);

  useEffect(() => {
    if (textarea.current) {
      textarea.current.focus();
      // Set Cursor position to the %? part of the template.
      textarea.current.setSelectionRange(initialCursorIndex, initialCursorIndex);
    }
  }, [textarea, initialCursorIndex]);

  const handleCaptureClick = () =>
    onCapture(template.get('id'), textareaValue, shouldPrepend, shouldCaptureAsNewHeader);

  const handleTextareaChange = (event) => setTextareaValue(event.target.value);

  const handlePrependSwitchToggle = () => setShouldPrepend(!shouldPrepend);

  const handleCaptureAsNewHeaderSwitchToggle = () =>
    setShouldCaptureAsNewHeader(!shouldCaptureAsNewHeader);

  return (
    <>
      <div className="capture-modal-header">
        <ActionButton
          letter={template.get('letter')}
          iconName={template.get('iconName')}
          isDisabled={false}
          onClick={() => {}}
          style={{ marginRight: 20 }}
        />

        <span>{template.get('description')}</span>
      </div>

      <div className="capture-modal-header-path">
        {template
          .get('headerPaths')
          .map((hP) => substituteTemplateVariables(hP)[0])
          .join(' > ')}
      </div>

      {targetHeader ? (
        <Fragment>
          <textarea
            className="textarea capture-modal-textarea"
            rows="4"
            value={textareaValue}
            onChange={handleTextareaChange}
            autoFocus
            ref={textarea}
          />
          <div className="capture-modal-button-container">
            <div className="capture-modal-prepend-container">
              <span className="capture-modal-prepend-label">Prepend:</span>
              <Switch isEnabled={shouldPrepend} onToggle={handlePrependSwitchToggle} />
            </div>
            <div className="capture-modal-prepend-container">
              <span className="capture-modal-prepend-label">Capture as new header:</span>
              <Switch
                isEnabled={shouldCaptureAsNewHeader}
                onToggle={handleCaptureAsNewHeaderSwitchToggle}
              />
            </div>
            <button className="btn capture-modal-button" onClick={handleCaptureClick}>
              Capture
            </button>
          </div>

          {/* Add padding to move the above textarea above the fold.
          More documentation, see getMinHeight(). */}
          {isMobileSafari13 && <div style={{ minHeight: getMinHeight() }} />}
        </Fragment>
      ) : (
        <div className="capture-modal-error-message">
          The specified header path doesn't exist in this org file!
        </div>
      )}

      <br />
    </>
  );
};
