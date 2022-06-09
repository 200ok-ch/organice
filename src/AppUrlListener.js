import { useEffect } from 'react';
// import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { handleAuthenticatedSyncService } from './App';
import { readInitialState } from './util/settings_persister';

const AppUrlListener = () => {
  // let history = useHistory();
  useEffect(() => {
    App.addListener('appUrlOpen', (event) => {
      // Some OAuth providers (i.e. GitLab) use query parameters.
      // Migrate them from the event.url to the actual
      // window.location.
      const newUrl = new URL(window.location.href);
      for (const entry of new URL(event.url).searchParams.entries()) {
        newUrl.searchParams.set(entry[0], entry[1]);
      }
      // Some OAuth providers (i.e. Dropbox) use the hash. Migrate it
      // from the event.url to window.location.
      newUrl.hash = new URL(event.url).hash;
      window.history.pushState(null, '', newUrl);
      handleAuthenticatedSyncService(readInitialState());

      // HACK: After the above code, the Dropbox login has succeeded.
      // However, the constructor in App.js has to run. For some
      // reason, this implicitly happens for GitLab. This could most
      // definitively be implemented in a more readable manner by
      // refactoring the App.js constructor.
      if (newUrl.hash) window.location.reload();

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
