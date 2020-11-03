import React, { useState, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Motion, spring } from 'react-motion';

import './stylesheet.css';

import { List } from 'immutable';

import * as orgActions from '../../../../actions/org';
import * as captureActions from '../../../../actions/capture';
import * as baseActions from '../../../../actions/base';

import sampleCaptureTemplates from '../../../../lib/sample_capture_templates';
import { headerWithId } from '../../../../lib/org_utils';
import { getCurrentTimestamp } from '../../../../lib/timestamps';

import ActionButton from './components/ActionButton/';

const ActionButtons = ({
  org,
  header,
  selectedHeaderId,
  base,
  staticFile,
  captureTemplates,
  path,
  selectedTableCellId,
  isLoading,
  shouldDisableSyncButtons,
  isNarrowed,
  hasActiveClock,
}) => {
  const [isDisplayingArrowButtons, setIsDisplayingArrowButtons] = useState(false);
  const [isDisplayingCaptureButtons, setIsDisplayingCaptureButtons] = useState(false);
  const [isDisplayingSearchButtons, setIsDisplayingSearchButtons] = useState(false);
  const [isDisplayingEditButtons, setIsDisplayingEditButtons] = useState(false);

  useEffect(() => {
    document.querySelector('html').style.paddingBottom = '90px';

    return () => (document.querySelector('html').style.paddingBottom = '0px');
  });

  const mainArrowButton = useRef(null);
  const mainEditButton = useRef(null);

  const mainArrowButtonBoundingRect = useMemo(
    () => (!!mainArrowButton.current ? mainArrowButton.current.getBoundingClientRect() : null),
    [mainArrowButton]
  );

  const mainEditButtonBoundingRect = useMemo(
    () => (!!mainEditButton.current ? mainEditButton.current.getBoundingClientRect() : null),
    [mainEditButton]
  );

  const handleUpClick = () =>
    !!selectedHeaderId ? org.moveHeaderUp(selectedHeaderId) : org.moveTableRowUp();

  const handleDownClick = () =>
    !!selectedHeaderId ? org.moveHeaderDown(selectedHeaderId) : org.moveTableRowDown();

  const handleLeftClick = () =>
    !!selectedHeaderId ? org.moveHeaderLeft(selectedHeaderId) : org.moveTableColumnLeft();

  const handleRightClick = () =>
    !!selectedHeaderId ? org.moveHeaderRight(selectedHeaderId) : org.moveTableColumnRight();

  const handleMoveSubtreeLeftClick = () => org.moveSubtreeLeft(selectedHeaderId);

  const handleMoveSubtreeRightClick = () => org.moveSubtreeRight(selectedHeaderId);

  const handleAddNewHeader = () => {
    setIsDisplayingCaptureButtons(false);
    org.addHeaderAndOpenEditor(selectedHeaderId);
  };

  const handleCaptureButtonClick = (templateId) => () => {
    setIsDisplayingCaptureButtons(false);
    base.activatePopup('capture', { templateId });
  };

  const getSampleCaptureTemplates = () => sampleCaptureTemplates;

  const getAvailableCaptureTemplates = () =>
    staticFile === 'sample'
      ? getSampleCaptureTemplates()
      : captureTemplates.filter(
          (template) =>
            template.get('isAvailableInAllOrgFiles') ||
            template
              .get('orgFilesWhereAvailable')
              .map((availablePath) =>
                availablePath.trim().startsWith('/')
                  ? availablePath.trim()
                  : '/' + availablePath.trim()
              )
              .includes((path || '').trim())
        );

  const handleSync = () => org.sync({ forceAction: 'manual' });

  const handleMainArrowButtonClick = () => setIsDisplayingArrowButtons(!isDisplayingArrowButtons);

  const handleMainSearchButtonClick = () => {
    setIsDisplayingSearchButtons(!isDisplayingSearchButtons);
  };

  const handleMainCaptureButtonClick = () => {
    if (!isDisplayingCaptureButtons && getAvailableCaptureTemplates().size === 0) {
      alert(
        `You don't have any capture templates set up for this file! Add some in Settings > Capture Templates`
      );
      return;
    }

    setIsDisplayingCaptureButtons(!isDisplayingCaptureButtons);
  };

  const handleMainEditButtonClick = () => setIsDisplayingEditButtons(!isDisplayingEditButtons);

  const handleEnterTitleEditMode = () => {
    setIsDisplayingEditButtons(false);
    base.activatePopup('title-editor');
  };

  const handleEnterDescriptionEditMode = () => {
    setIsDisplayingEditButtons(false);
    org.openHeader(selectedHeaderId);
    base.activatePopup('description-editor');
  };

  const handleNarrowClick = () => {
    setIsDisplayingEditButtons(false);
    org.narrowHeader(selectedHeaderId);
  };
  const handleWidenClick = () => {
    setIsDisplayingEditButtons(false);
    org.widenHeader();
  };

  const handleShowTagsModal = () => {
    setIsDisplayingEditButtons(false);
    base.activatePopup('tags-editor');
  };

  const handleShowPropertyListEditorModal = () => {
    setIsDisplayingEditButtons(false);
    base.activatePopup('property-list-editor');
  };

  const handleDeadlineAndScheduledClick = (planningType) => {
    const existingDeadlinePlanningItemIndex = header
      .get('planningItems', [])
      .findIndex((planningItem) => planningItem.get('type') === planningType);

    if (existingDeadlinePlanningItemIndex === -1) {
      org.addNewPlanningItem(selectedHeaderId, planningType);
      base.activatePopup('timestamp-editor', {
        headerId: selectedHeaderId,
        planningItemIndex: header.get('planningItems').size,
      });
    } else {
      base.activatePopup('timestamp-editor', {
        headerId: selectedHeaderId,
        planningItemIndex: existingDeadlinePlanningItemIndex,
      });
    }
    org.openHeader(selectedHeaderId);
  };

  const handleDeadlineClick = () => {
    setIsDisplayingEditButtons(false);
    handleDeadlineAndScheduledClick('DEADLINE');
  };

  const handleClockInOutClick = () => {
    setIsDisplayingEditButtons(false);
    const logBook = header.get('logBookEntries', []);
    const existingClockIndex = logBook.findIndex((entry) => entry.get('end') === null);
    const now = getCurrentTimestamp({ isActive: false, withStartTime: true });
    if (existingClockIndex !== -1) {
      org.setLogEntryStop(header.get('id'), logBook.getIn([existingClockIndex, 'id']), now);
    } else {
      org.createLogEntryStart(header.get('id'), now);
    }
  };

  const handleScheduledClick = () => {
    setIsDisplayingEditButtons(false);
    handleDeadlineAndScheduledClick('SCHEDULED');
  };

  const handleShareHeaderClick = () => {
    setIsDisplayingEditButtons(false);

    const titleLine = header.get('titleLine');
    const todoKeyword = titleLine.get('todoKeyword');
    const tags = titleLine.get('tags');
    const title = titleLine.get('rawTitle').trim();
    const subject = todoKeyword ? `${todoKeyword} ${title}` : title;
    const body = `
${tags.isEmpty() ? '' : `Tags: ${tags.join(' ')}\n`}
${header.get('rawDescription')}`;
    //const titleParts = titleLine.get('title'); // List of parsed tokens in title
    //const properties = header.get('propertyListItem'); //.get(0) .get('property') or .get('value')
    //const planningItems = header.get('planningItems'); //.get(0) .get('type') [DEADLINE|SCHEDULED] or .get('timestamp')
    const mailtoURI = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
    // TODO: If available, use webshare
    // Maybe there's synergy with this PR: https://github.com/200ok-ch/organice/pull/138/files

    window.open(mailtoURI);
    // INFO: Alternative implementation that works without having a
    // popup window. We didn't go this route, because it's non-trivial
    // to mock the window object, so it's harder to test. Having
    // slightly worse UX in favor of having a test is not optimal, as
    // well, of course.
    // window.location.href = mailtoURI;
  };

  const handleAddNoteClick = () => {
    setIsDisplayingEditButtons(false);
    let input = prompt('Enter a note to add to the header:');
    if (input !== null) input = input.trim();
    if (!input) return;

    org.addNote(input, new Date());
  };

  const handleRemoveHeaderClick = () => {
    setIsDisplayingEditButtons(false);
    org.removeHeader(header.get('id'));
  };

  const handleRefileHeaderRequest = () => {
    setIsDisplayingEditButtons(false);
    base.activatePopup('refile');
  };

  const renderCaptureButtons = () => {
    const availableCaptureTemplates = getAvailableCaptureTemplates();

    const baseCaptureButtonStyle = {
      position: 'absolute',
      zIndex: 0,
      left: 0,
      opacity:
        isDisplayingArrowButtons || isDisplayingSearchButtons || isDisplayingEditButtons ? 0 : 1,
    };
    if (!isDisplayingCaptureButtons) {
      baseCaptureButtonStyle.boxShadow = 'none';
    }

    const mainButtonStyle = {
      opacity:
        isDisplayingArrowButtons || isDisplayingSearchButtons || isDisplayingEditButtons ? 0 : 1,
      position: 'relative',
      zIndex: 1,
    };

    const animatedStyle = {
      bottom: spring(isDisplayingCaptureButtons ? 70 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={animatedStyle}>
        {(style) => (
          <div className="action-drawer__capture-buttons-container">
            <ActionButton
              iconName={isDisplayingCaptureButtons ? 'times' : 'plus'}
              isDisabled={
                isDisplayingArrowButtons || isDisplayingSearchButtons || isDisplayingEditButtons
              }
              onClick={handleMainCaptureButtonClick}
              style={mainButtonStyle}
              tooltip={
                isDisplayingCaptureButtons ? 'Hide capture templates' : 'Show capture templates'
              }
            />
            <ActionButton
              iconName={'plus'}
              isDisabled={false}
              onClick={handleAddNewHeader}
              style={{ ...baseCaptureButtonStyle, bottom: style.bottom }}
              tooltip={'Create new header below'}
            />
            {availableCaptureTemplates.map((template, index) => (
              <ActionButton
                key={template.get('id')}
                letter={template.get('letter')}
                iconName={template.get('iconName')}
                isDisabled={false}
                onClick={handleCaptureButtonClick(template.get('id'))}
                style={{ ...baseCaptureButtonStyle, bottom: style.bottom * (index + 2) }}
                tooltip={`Activate "${template.get('description')}" capture template`}
              />
            ))}
          </div>
        )}
      </Motion>
    );
  };

  const renderSearchButtons = () => {
    const baseSearchButtonStyle = {
      position: 'absolute',
      zIndex: 0,
      left: 0,
      opacity:
        isDisplayingArrowButtons || isDisplayingCaptureButtons || isDisplayingEditButtons ? 0 : 1,
    };
    if (!isDisplayingSearchButtons) {
      baseSearchButtonStyle.boxShadow = 'none';
    }

    const mainButtonStyle = {
      opacity:
        isDisplayingArrowButtons || isDisplayingCaptureButtons || isDisplayingEditButtons ? 0 : 1,
      position: 'relative',
      zIndex: 1,
    };

    const animatedStyle = {
      bottom: spring(isDisplayingSearchButtons ? 70 : 0, { stiffness: 300 }),
    };

    return (
      <Motion style={animatedStyle}>
        {(style) => (
          <div className="action-drawer__capture-buttons-container">
            <ActionButton
              iconName={isDisplayingSearchButtons ? 'times' : 'search'}
              isDisabled={
                isDisplayingArrowButtons || isDisplayingCaptureButtons || isDisplayingEditButtons
              }
              onClick={handleMainSearchButtonClick}
              style={mainButtonStyle}
              tooltip={
                isDisplayingSearchButtons ? 'Hide Search / Task List' : 'Show Search / Task List'
              }
            />

            <ActionButton
              iconName="calendar-alt"
              shouldSpinSubIcon={isLoading}
              isDisabled={false}
              onClick={handleAgendaClick}
              style={{ ...baseSearchButtonStyle, bottom: style.bottom * 1 }}
              tooltip="Show agenda"
            />

            <ActionButton
              iconName="search"
              isDisabled={false}
              onClick={handleSearchClick}
              style={{ ...baseSearchButtonStyle, bottom: style.bottom * 2 }}
              tooltip="Show search"
            />

            <ActionButton
              iconName="tasks"
              isDisabled={false}
              onClick={handleTaskListClick}
              style={{ ...baseSearchButtonStyle, bottom: style.bottom * 3 }}
              tooltip="Show task list"
            />
          </div>
        )}
      </Motion>
    );
  };

  const renderMovementButtons = () => {
    const baseArrowButtonStyle = {
      opacity:
        isDisplayingCaptureButtons || isDisplayingSearchButtons || isDisplayingEditButtons ? 0 : 1,
    };
    if (!isDisplayingArrowButtons) {
      baseArrowButtonStyle.boxShadow = 'none';
    }

    let centerXOffset = 0;
    if (!!mainArrowButtonBoundingRect) {
      centerXOffset =
        window.screen.width / 2 -
        (mainArrowButtonBoundingRect.x + mainArrowButtonBoundingRect.width / 2);
    }

    const animatedStyles = {
      centerXOffset: spring(isDisplayingArrowButtons ? centerXOffset : 0, { stiffness: 300 }),
      topRowYOffset: spring(isDisplayingArrowButtons ? 150 : 0, { stiffness: 300 }),
      bottomRowYOffset: spring(isDisplayingArrowButtons ? 80 : 0, { stiffness: 300 }),
      firstColumnXOffset: spring(isDisplayingArrowButtons ? 70 : 0, {
        stiffness: 300,
      }),
      secondColumnXOffset: spring(isDisplayingArrowButtons ? 140 : 0, {
        stiffness: 300,
      }),
    };

    return (
      <Motion style={animatedStyles}>
        {(style) => (
          <div
            className="action-drawer__arrow-buttons-container"
            style={{ left: style.centerXOffset }}
          >
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-up"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={
                isDisplayingCaptureButtons || isDisplayingSearchButtons || isDisplayingEditButtons
              }
              onClick={handleUpClick}
              style={{ ...baseArrowButtonStyle, bottom: style.topRowYOffset }}
              tooltip={!!selectedTableCellId ? 'Move row up' : 'Move header up'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-down"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={handleDownClick}
              style={{ ...baseArrowButtonStyle, bottom: style.bottomRowYOffset }}
              tooltip={!!selectedTableCellId ? 'Move row down' : 'Move header down'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-left"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={handleLeftClick}
              style={{
                ...baseArrowButtonStyle,
                bottom: style.bottomRowYOffset,
                right: style.firstColumnXOffset,
              }}
              tooltip={!!selectedTableCellId ? 'Move column left' : 'Move header left'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="arrow-right"
              subIconName={!!selectedTableCellId ? 'table' : null}
              isDisabled={false}
              onClick={handleRightClick}
              style={{
                ...baseArrowButtonStyle,
                bottom: style.bottomRowYOffset,
                left: style.firstColumnXOffset,
              }}
              tooltip={!!selectedTableCellId ? 'Move column right' : 'Move header right'}
            />
            {!selectedTableCellId && (
              <>
                <ActionButton
                  additionalClassName="action-drawer__arrow-button"
                  iconName="chevron-left"
                  isDisabled={false}
                  onClick={handleMoveSubtreeLeftClick}
                  style={{
                    ...baseArrowButtonStyle,
                    bottom: style.bottomRowYOffset,
                    right: style.secondColumnXOffset,
                  }}
                  tooltip="Move entire subtree left"
                />
                <ActionButton
                  additionalClassName="action-drawer__arrow-button"
                  iconName="chevron-right"
                  isDisabled={false}
                  onClick={handleMoveSubtreeRightClick}
                  style={{
                    ...baseArrowButtonStyle,
                    bottom: style.bottomRowYOffset,
                    left: style.secondColumnXOffset,
                  }}
                  tooltip="Move entire subtree right"
                />
              </>
            )}

            <ActionButton
              iconName={isDisplayingArrowButtons ? 'times' : 'arrows-alt'}
              subIconName={!!selectedTableCellId ? 'table' : null}
              additionalClassName="action-drawer__main-arrow-button"
              isDisabled={false}
              onClick={handleMainArrowButtonClick}
              style={{
                opacity:
                  isDisplayingCaptureButtons || isDisplayingSearchButtons || isDisplayingEditButtons
                    ? 0
                    : 1,
              }}
              tooltip={isDisplayingArrowButtons ? 'Hide movement buttons' : 'Show movement buttons'}
              onRef={mainArrowButton}
            />
          </div>
        )}
      </Motion>
    );
  };

  const renderEditButtons = () => {
    const showEditButtons = isDisplayingEditButtons && !!selectedHeaderId;
    if (!showEditButtons && isDisplayingEditButtons) {
      setIsDisplayingEditButtons(false);
    }

    const baseEditButtonStyle = {
      zIndex: 1,
      opacity:
        !selectedHeaderId ||
        isDisplayingCaptureButtons ||
        isDisplayingSearchButtons ||
        isDisplayingArrowButtons
          ? 0
          : 1,
    };
    if (!showEditButtons) {
      baseEditButtonStyle.boxShadow = 'none';
    }

    let centerXOffset = 0;
    if (!!mainEditButtonBoundingRect) {
      centerXOffset =
        window.screen.width / 2 -
        (mainEditButtonBoundingRect.x + mainEditButtonBoundingRect.width / 2);
    }

    let actionDrawerContainerWidth = document.getElementById('root').scrollWidth - 20;
    const actionDrawerContainer = document
      .getElementsByClassName('action-drawer-container')
      .item(0);
    if (!!actionDrawerContainer) {
      actionDrawerContainerWidth = document
        .getElementsByClassName('action-drawer-container')
        .item(0).scrollWidth;
    }

    const distance = (actionDrawerContainerWidth - 60) / 4;
    const animatedStyles = {
      centerXOffset: spring(showEditButtons ? centerXOffset : 0, { stiffness: 300 }),
      topRowYOffset: spring(showEditButtons ? 160 : 0, { stiffness: 300 }),
      middleRowYOffset: spring(showEditButtons ? 80 : 0, { stiffness: 300 }),
      firstColumnXOffset: spring(showEditButtons ? 4 * distance : 0, {
        stiffness: 300,
      }),
      secondColumnXOffset: spring(showEditButtons ? 3 * distance : 0, {
        stiffness: 300,
      }),
      thirdColumnXOffset: spring(showEditButtons ? 2 * distance : 0, {
        stiffness: 300,
      }),
      fourthColumnXOffset: spring(showEditButtons ? distance : 0, {
        stiffness: 300,
      }),
    };

    return (
      <Motion style={animatedStyles}>
        {(style) => (
          <div
            className="action-drawer__arrow-buttons-container"
            style={{ left: style.centerXOffset }}
          >
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="pencil-alt"
              isDisabled={
                isDisplayingArrowButtons || isDisplayingCaptureButtons || isDisplayingSearchButtons
              }
              onClick={handleEnterTitleEditMode}
              style={{ ...baseEditButtonStyle, bottom: style.middleRowYOffset }}
              tooltip={'Edit header title'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="edit"
              isDisabled={false}
              onClick={handleEnterDescriptionEditMode}
              style={{
                ...baseEditButtonStyle,
                right: style.fourthColumnXOffset,
              }}
              tooltip={'Edit header description'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="tags"
              isDisabled={false}
              onClick={handleShowTagsModal}
              style={{
                ...baseEditButtonStyle,
                bottom: style.middleRowYOffset,
                right: style.secondColumnXOffset,
              }}
              tooltip={'Modify tags'}
            />
            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="list"
              isDisabled={false}
              onClick={handleShowPropertyListEditorModal}
              style={{
                ...baseEditButtonStyle,
                bottom: style.middleRowYOffset,
                right: style.thirdColumnXOffset,
              }}
              tooltip={'Modify properties'}
            />

            <>
              <ActionButton
                additionalClassName="action-drawer__arrow-button"
                iconName={isNarrowed ? 'expand' : 'compress'}
                isDisabled={false}
                onClick={isNarrowed ? handleWidenClick : handleNarrowClick}
                style={{
                  ...baseEditButtonStyle,
                  bottom: style.middleRowYOffset,
                  right: style.firstColumnXOffset,
                }}
                tooltip={
                  isNarrowed
                    ? 'Widen (Cancelling the narrowing.)'
                    : 'Narrow to subtree (focusing in on some portion of the buffer, making the rest temporarily inaccessible.)'
                }
              />
            </>

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="envelope"
              isDisabled={false}
              onClick={handleShareHeaderClick}
              style={{
                ...baseEditButtonStyle,
                bottom: style.topRowYOffset,
                right: style.firstColumnXOffset,
              }}
              tooltip="Share this header via email"
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="calendar-check"
              isDisabled={false}
              onClick={handleDeadlineClick}
              style={{
                ...baseEditButtonStyle,
                right: style.firstColumnXOffset,
              }}
              tooltip="Set deadline datetime"
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="calendar-times"
              isDisabled={false}
              onClick={handleScheduledClick}
              style={{
                ...baseEditButtonStyle,
                right: style.secondColumnXOffset,
              }}
              tooltip="Set scheduled datetime"
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName={hasActiveClock ? 'hourglass-end' : 'hourglass-start'}
              isDisabled={false}
              onClick={handleClockInOutClick}
              style={{
                ...baseEditButtonStyle,
                right: style.thirdColumnXOffset,
              }}
              tooltip={hasActiveClock ? 'Clock out (Stop the clock)' : 'Clock in (Start the clock)'}
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="file-export"
              isDisabled={false}
              onClick={handleRefileHeaderRequest}
              style={{
                ...baseEditButtonStyle,
                bottom: style.topRowYOffset,
              }}
              tooltip="Refile this header to another header"
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="sticky-note"
              isDisabled={false}
              onClick={handleAddNoteClick}
              style={{
                ...baseEditButtonStyle,
                bottom: style.middleRowYOffset,
                right: style.fourthColumnXOffset,
              }}
              tooltip="Add a note"
            />

            <ActionButton
              additionalClassName="action-drawer__arrow-button"
              iconName="trash"
              isDisabled={false}
              onClick={handleRemoveHeaderClick}
              style={{
                ...baseEditButtonStyle,
                bottom: style.topRowYOffset,
                right: style.thirdColumnXOffset,
              }}
              tooltip="Remove header"
            />

            <ActionButton
              iconName={showEditButtons ? 'times' : 'pencil-alt'}
              additionalClassName="action-drawer__main-arrow-button"
              isDisabled={!selectedHeaderId}
              onClick={handleMainEditButtonClick}
              style={{
                opacity:
                  isDisplayingCaptureButtons ||
                  isDisplayingSearchButtons ||
                  isDisplayingArrowButtons
                    ? 0
                    : 1,
              }}
              tooltip={showEditButtons ? 'Hide edit buttons' : 'Show edit buttons'}
              onRef={mainEditButton}
            />
          </div>
        )}
      </Motion>
    );
  };

  const handleAgendaClick = () => {
    setIsDisplayingSearchButtons(false);
    base.activatePopup('agenda');
  };
  const handleTaskListClick = () => {
    setIsDisplayingSearchButtons(false);
    base.activatePopup('task-list');
  };
  const handleSearchClick = () => {
    setIsDisplayingSearchButtons(false);
    base.activatePopup('search');
  };

  return (
    <div className="action-drawer-container nice-scroll">
      <ActionButton
        iconName="cloud"
        subIconName="sync-alt"
        shouldSpinSubIcon={isLoading}
        isDisabled={
          shouldDisableSyncButtons ||
          isDisplayingArrowButtons ||
          isDisplayingCaptureButtons ||
          isDisplayingSearchButtons ||
          isDisplayingEditButtons
        }
        onClick={handleSync}
        style={{
          opacity:
            isDisplayingArrowButtons ||
            isDisplayingCaptureButtons ||
            isDisplayingSearchButtons ||
            isDisplayingEditButtons
              ? 0
              : 1,
        }}
        tooltip="Sync changes"
      />
      {renderSearchButtons()}
      {renderMovementButtons()}
      {renderCaptureButtons()}
      {renderEditButtons()}
    </div>
  );
};

const mapStateToProps = (state) => {
  const path = state.org.present.get('path');
  const selectedHeaderId = state.org.present.get('selectedHeaderId');
  const narrowedHeaderId = state.org.present.get('narrowedHeaderId');

  const headers = state.org.present.get('headers');
  const header = headerWithId(headers, selectedHeaderId);
  const logBookEntries = header
    .get('logBookEntries')
    .filter((entry) => entry.get('raw') === undefined);
  const hasActiveClock =
    logBookEntries.size !== 0 && logBookEntries.filter((entry) => !entry.get('end')).size !== 0;

  return {
    selectedHeaderId,
    header,
    isDirty: state.org.present.get('isDirty'),
    isNarrowed: !!narrowedHeaderId,
    selectedTableCellId: state.org.present.get('selectedTableCellId'),
    captureTemplates: state.capture.get('captureTemplates', List()),
    path,
    isLoading: state.base.get('isLoading'),
    hasActiveClock,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    org: bindActionCreators(orgActions, dispatch),
    capture: bindActionCreators(captureActions, dispatch),
    base: bindActionCreators(baseActions, dispatch),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ActionButtons);
