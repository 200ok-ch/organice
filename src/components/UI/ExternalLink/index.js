import React from 'react';
export default ({ href, children }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children ? children : href}
    </a>
  );
};
