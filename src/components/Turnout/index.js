// organice renders different kinds of components:
//  - Static pages like the landing page
//  - The actual application
// These components do not have many things in common, neither CSS,
// nor structure. See adr-002 for details <Turnout />
// ensures rendering either a static page or a dynamic application
// component.

import React, { lazy, Suspense } from 'react';
import { connect } from 'react-redux';

import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

// Lazy load Landing so its dependencies (FontAwesome JS) are not bundled into the main app.
// This prevents the FontAwesome JS from executing and freezing the main app on load.
// See: https://github.com/200ok-ch/organice/pull/1091
const Landing = lazy(() => import('../Landing'));
import Entry from '../Entry';
import PrivacyPolicy from '../PrivacyPolicy';
import SyncServiceSignIn from '../SyncServiceSignIn';
import OrgFile from '../OrgFile';
import HeaderBar from '../HeaderBar';

const Turnout = ({ isAuthenticated }) => {
  if (isAuthenticated) return <Entry />;

  if (!isAuthenticated)
    return (
      <div>
        <Switch>
          <Route path="/privacy-policy" exact>
            <div className="App entry-container">
              <HeaderBar />
              <PrivacyPolicy />
            </div>
          </Route>
          <Route path="/sample" exact={true}>
            <div className="App entry-container">
              <HeaderBar />
              <OrgFile
                staticFile="sample"
                shouldDisableDirtyIndicator={true}
                shouldDisableActionDrawer={false}
                shouldDisableSyncButtons={true}
                parsingErrorMessage={
                  "The contents of sample.org couldn't be loaded. You probably forgot to set the environment variable - see the Development section of README.org for details!"
                }
              />
            </div>
          </Route>
          <Route path="/sign_in" exact={true}>
            <div className="App entry-container">
              <HeaderBar />
              <SyncServiceSignIn />
            </div>
          </Route>
          <Route path="/" exact={true}>
            <Suspense fallback={<div className="App landing-page">Loading...</div>}>
              <div className="App landing-page">
                <Landing />
              </div>
            </Suspense>
          </Route>
          <Redirect to="/" />
        </Switch>
      </div>
    );
};

const mapStateToProps = (state) => {
  return {
    isAuthenticated: state.syncBackend.get('isAuthenticated'),
  };
};

export default withRouter(connect(mapStateToProps)(Turnout));
