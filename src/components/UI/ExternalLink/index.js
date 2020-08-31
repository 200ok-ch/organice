import React from 'react';
export default ({ href, content, key }) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" key={key}>
      {content ? content : href}
    </a>
  );
};
