import React from 'react';
export default ({ href, key, children }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" key={key}>
      {children ? children : href}
    </a>
  );
};
