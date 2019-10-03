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

  /** Is the browser Mobile Safari with iOS version of at least 13 */
  const isNewestMobileSafari = (() => {
    const browser = Bowser.getParser(window.navigator.userAgent);

    return browser.satisfies({
      mobile: {
        safari: '>=13',
      },
    });
  })();

  /** Is iPhone Model X (tested with Xs) */
  const isIphoneX = window.matchMedia(
    '(max-device-width: 812px) and (-webkit-device-pixel-ratio : 3)'
  ).matches;

  /** Is iPhone Model 6, 7 or 8 (tested with 6s) */
  const isIphone678 = window.matchMedia(
    '(min-device-width: 375px) and (-webkit-device-pixel-ratio : 2)'
  ).matches;

  /** Is running in standalone mode (not in Mobile Safari) */
  const isRunningAsPWA = 'standalone' in window.navigator && window.navigator.standalone;

  /** Is running in Landscape Mode (as opposed to Portait Mode) */
  function isInLandscapeMode() {
    return [90, -90].includes(window.orientation);
  }

  /** INFO: Mobile Safari does _not_ like it when the focus is set
   * without an explicit user interaction. This is the case in
   * organice, because the user interaction is on a button which in
   * turn opens a textarea which should have the focus. It will open
   * the software keyboard, but the capture template will stay on the
   * bottom of the view, so it will be hidden by the keyboard. The
   * user would have to manually scroll down. On iOS 12, it worked
   * without this workaround. */
  const getMinHeight = () => {
    // Only Mobile Safari needs the shenannigans for moving the input
    // above the software keyboard.
    if (isNewestMobileSafari) {
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
          {isNewestMobileSafari && <div style={{ minHeight: getMinHeight() }} />}
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
