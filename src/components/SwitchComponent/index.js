import React from 'react';

import Landing from '../Landing';
import Entry from '../Entry';

import { isLandingPage } from '../../util/misc';

export default () => {
  if (isLandingPage()) {
    return (
      <div className="App landing-page">
        <Landing />
      </div>
    );
  } else {
    return <Entry />;
  }
};
