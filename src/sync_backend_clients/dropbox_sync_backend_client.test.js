import {
  dropboxDirectoryListing,
  dropboxDirectoryListingSorted,
} from './fixtures/directory_listing';

const { filterAndSortDirectoryListing } = require('./dropbox_sync_backend_client');

test('Filters down to Org files and orders alphabetically', () => {
  expect(filterAndSortDirectoryListing(dropboxDirectoryListing)).toEqual(
    dropboxDirectoryListingSorted
  );
});
