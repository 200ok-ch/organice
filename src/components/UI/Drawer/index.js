import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';

import './stylesheet.css';

import { Motion, spring } from 'react-motion';
import classNames from 'classnames';

export default ({ children, shouldIncludeCloseButton, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(null);

  let initialClientY = null;

  const innerContainer = useRef();

  useLayoutEffect(() => setIsVisible(true), []);

  let innerContainerHeight = null;
  useLayoutEffect(() => (innerContainerHeight = innerContainer.current.offsetHeight));
  const endInnerContainerDrag = endingDragOffset => {
    setIsVisible(endingDragOffset <= innerContainerHeight * 0.3);
    setDragOffsetY(null);
  };

  const handleInnerContainerClick = event => event.stopPropagation();

  const handleClose = () => setIsVisible(false);

  const handleAnimationRest = () => (!isVisible && !!onClose ? onClose() : void 0);

  const handleTouchStart = event => (initialClientY = event.targetTouches[0].clientY);

  const handleTouchMove = event => {
    if (event.target.classList.contains('drag-handle')) {
      return;
    }

    const isScrollingDown = initialClientY > event.targetTouches[0].clientY;

    if (
      isScrollingDown &&
      innerContainer.current.scrollHeight - innerContainer.current.scrollTop <=
        innerContainer.current.clientHeight
    ) {
      event.preventDefault();
    } else if (!isScrollingDown && innerContainer.current.scrollTop === 0) {
      event.preventDefault();

      setDragOffsetY(event.targetTouches[0].clientY - initialClientY);
    }
  };

  const handleTouchEndOrCancel = event => endInnerContainerDrag(dragOffsetY);

  useEffect(
    () => {
      if (!!innerContainer.current) {
        // Super annoying logic for disabling scrolling of the body when a slide up is active.
        // Briefly: if we're already at the top of our Drawer and trying to scroll up, disable
        // scrolling. Likewise, if we're already at the bottom of our Drawer and trying to scroll
        // down, disable scrolling.
        innerContainer.current.addEventListener('touchstart', handleTouchStart);
        innerContainer.current.addEventListener('touchmove', handleTouchMove);
        innerContainer.current.addEventListener('touchend', handleTouchEndOrCancel);
        innerContainer.current.addEventListener('touchcancel', handleTouchEndOrCancel);

        return () => {
          innerContainer.current.removeEventListener('touchstart', handleTouchStart);
          innerContainer.current.removeEventListener('touchmove', handleTouchMove);
          innerContainer.current.removeEventListener('touchend', handleTouchEndOrCancel);
          innerContainer.current.removeEventListener('touchcancel', handleTouchEndOrCancel);
        };
      } else {
        return null;
      }
    },
    [innerContainer.current]
  );

  useEffect(
    () => {
      // A ridiculous hack to get around what is presumably a Mobile Safari bug in iOS 12.
      // Without this, I can't scroll the inner container in the agenda view.
      setTimeout(() => {
        innerContainer.current.style.left = '0';
        setTimeout(() => {
          innerContainer.current.style.left = '-1px';
        }, 0);
      }, 0);
    },
    [children]
  );

  const outerClassName = classNames('slide-up-outer-container', {
    'slide-up-outer-container--visible': isVisible,
  });

  const innerStyle = {
    offsetY:
      dragOffsetY ||
      spring(isVisible ? 0 : innerContainerHeight || window.innerHeight, {
        stiffness: 300,
      }),
  };

  return (
    <Motion style={innerStyle} onRest={handleAnimationRest}>
      {style => {
        const interpolatedStyle = {
          transform: `translateY(${style.offsetY}px)`,
        };

        return (
          <div className={outerClassName} onClick={!!onClose ? handleClose : null}>
            <div
              onClick={handleInnerContainerClick}
              className="slide-up-inner-container nice-scroll"
              ref={innerContainer}
              style={interpolatedStyle}
            >
              <div className="slide-up__grabber" />

              {shouldIncludeCloseButton && (
                <button
                  className="fas fa-times fa-lg slide-up__close-button"
                  onClick={handleClose}
                />
              )}

              {children}
            </div>
          </div>
        );
      }}
    </Motion>
  );
};
