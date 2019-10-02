import React, { Fragment, useState, useEffect, useRef, useMemo } from 'react';
import Bowser from 'bowser';

import './stylesheet.css';

import ActionButton from '../ActionDrawer/components/ActionButton/';
import Switch from '../../../UI/Switch/';
import Drawer from '../../../UI/Drawer/';

import { headerWithPath } from '../../../../lib/org_utils';
import substituteTemplateVariables from '../../../../lib/capture_template_substitution';

export default ({ template, onCapture, headers, onClose }) => {
  const [substitutedTemplate, initialCursorIndex] = useMemo(
    () => substituteTemplateVariables(template.get('template')),
    [template]
  );

  const targetHeader = useMemo(() => headerWithPath(headers, template.get('headerPaths')), [
    headers,
    template,
  ]);

  const [textareaValue, setTextareaValue] = useState(substitutedTemplate);
  const [shouldPrepend, setShouldPrepend] = useState(template.get('shouldPrepend'));

  const browser = Bowser.getParser(window.navigator.userAgent);

  const isNewMobileSafari = browser.satisfies({
    mobile: {
      safari: '>=13',
    },
  });

  // INFO: Mobile Safari does _not_ like it when the focus is set
  // without an explicit user interaction (which is the case here,
  // because the user interaction is on a button which in turn opens a
  // textarea which should have the focus). It will open the software
  // keyboard, but the capture template will stay on the bottom of the
  // view, so it will be hidden by the keyboard. The user would have
  // to manually scroll down. On iOS 12, it worked without this
  // workaround.
  // The following `min-height` values are measured for an iPhone Xs.
  // TODO: Measure the values for other iPhone form factors and iPads.
  const getMinHeight = () => {
    // Only Mobile Safari needs the shenannigans for moving the input
    // above the software keyboard.
    if (isNewMobileSafari) {
      // Within PWA
      if ('standalone' in window.navigator && window.navigator.standalone) {
        // Landscape mode
        if ([90, -90].includes(window.orientation)) {
          return '9em';
        }
        // Portrait Mode
        else {
          return '23em';
        }
      }
      // Not within PWA, but standard Mobile Safari
      else {
        // Landscape mode
        if ([90, -90].includes(window.orientation)) {
          return '9em';
        }
        // Portrait Mode
        else {
          return '18em';
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
    }
    // Set Cursor position to the %? part of the template.
    textarea.current.setSelectionRange(initialCursorIndex, initialCursorIndex);
  }, [textarea, initialCursorIndex]);

  const handleCaptureClick = () => onCapture(template.get('id'), textareaValue, shouldPrepend);

  const handleTextareaChange = event => setTextareaValue(event.target.value);

  const handlePrependSwitchToggle = () => setShouldPrepend(!shouldPrepend);

  return (
    <Drawer onClose={onClose}>
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

      <div className="capture-modal-header-path">{template.get('headerPaths').join(' > ')}</div>

      {!!targetHeader ? (
        <Fragment>
          <textarea
            className="textarea capture-modal-textarea"
            rows="4"
            value={textareaValue}
            onChange={handleTextareaChange}
            autoFocus={true}
            ref={textarea}
          />
          <div className="capture-modal-button-container">
            <div className="capture-modal-prepend-container">
              <span className="capture-modal-prepend-label">Prepend:</span>
              <Switch isEnabled={shouldPrepend} onToggle={handlePrependSwitchToggle} />
            </div>

            <button className="btn capture-modal-button" onClick={handleCaptureClick}>
              Capture
            </button>
          </div>
          {/* Add padding to move the above textarea above the fold.
          More documentation, see getMinHeight(). */}
          {isNewMobileSafari && <div style={{ minHeight: getMinHeight() }} />}
        </Fragment>
      ) : (
        <div className="capture-modal-error-message">
          The specified header path doesn't exist in this org file!
        </div>
      )}

      <br />
    </Drawer>
  );
};
