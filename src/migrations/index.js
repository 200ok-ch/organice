import migrateAccessTokenToDropboxAccessToken from './migrate_access_token_to_dropbox_access_token';
import migrateStoreInDropboxToStoreInSyncBackend from './migrate_store_in_dropbox_to_store_in_sync_backend';

export default () => {
  migrateAccessTokenToDropboxAccessToken();
  migrateStoreInDropboxToStoreInSyncBackend();
};
