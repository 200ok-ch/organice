import React, { useEffect } from 'react';
// import { useHistory } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { handleAuthenticatedSyncService } from './App';
import { readInitialState } from './util/settings_persister';

const AppUrlListener: React.FC<any> = () => {
  // let history = useHistory();
  useEffect(() => {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {

      const newUrl = new URL(window.location.href);
      for(const entry of new URL(event.url).searchParams.entries()) {
        newUrl.searchParams.set(entry[0], entry[1]);
      }
      window.history.pushState(null, '', newUrl);
      handleAuthenticatedSyncService(readInitialState());

      // // Example url: https://beerswift.app/tabs/tab2
      // // slug = /tabs/tab2
      // const slug = event.url.split('organice.200ok.ch').pop();
      // if (slug) {
      //   //alert(slug);
      //   history.push(slug);
      // }
      // // If no match, do nothing - let regular routing
      // // logic take over
    });
  }, []);

  return null;
};

export default AppUrlListener;
