// organice renders different kinds of components:
//  - Static pages like the landing page
//  - The actual application
// These components do not have many things in common. See adr-002 for
// details Neither CSS, nor structure. <SwitchComponent /> ensures
// rendering either a static page or a dynamic application component.

import React from 'react';
import { connect } from 'react-redux';

import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import Landing from '../Landing';
import Entry from '../Entry';
import PrivacyPolicy from '../PrivacyPolicy';
import SyncServiceSignIn from '../SyncServiceSignIn';
import OrgFile from '../OrgFile';
import HeaderBar from '../HeaderBar';

const SwitchComponent = ({ isAuthenticated }) => {
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
            <div className="App landing-page">
              <Landing />
            </div>
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

const mapDispatchToProps = (dispatch) => {
  return {};
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SwitchComponent));
