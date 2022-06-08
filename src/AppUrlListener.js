import { useEffect } from 'react';
// import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { handleAuthenticatedSyncService } from './App';
import { readInitialState } from './util/settings_persister';

const AppUrlListener = () => {
  // let history = useHistory();
  useEffect(() => {
    App.addListener('appUrlOpen', (event) => {
      const newUrl = new URL(window.location.href);
      for (const entry of new URL(event.url).searchParams.entries()) {
        newUrl.searchParams.set(entry[0], entry[1]);
      }
      newUrl.hash = new URL(event.url).hash;
      window.history.pushState(null, '', newUrl);
      handleAuthenticatedSyncService(readInitialState());

      // window.location.reload();

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
