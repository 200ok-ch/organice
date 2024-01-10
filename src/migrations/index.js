import migrateAccessTokenToDropboxAccessToken from './migrate_access_token_to_dropbox_access_token';
import migrateStoreInDropboxToStoreInSyncBackend from './migrate_store_in_dropbox_to_store_in_sync_backend';
import migrateNonsenseValuesInLocalstorage from './migrate_nonsense_values_in_localstorage';
import migrateCaptureTemplates from './migrate_capture_templates';

export default () => {
  migrateAccessTokenToDropboxAccessToken();
  migrateStoreInDropboxToStoreInSyncBackend();
  migrateNonsenseValuesInLocalstorage();
  migrateCaptureTemplates();
};
