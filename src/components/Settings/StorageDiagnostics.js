import React, { useEffect, useState } from 'react';

import { localStorageAvailable } from '../../util/settings_persister';
import { getLocalStorageUsage, getWriteFailures } from '../../util/local_storage';
import { getAllFileRecords } from '../../util/file_store';

const LARGEST_KEYS_SHOWN = 10;

const formatCount = (count) => count.toLocaleString('en-US');

const formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

// Read-only view of the browser storage organice uses. Helps to
// diagnose a full localStorage, which makes writes fail.
export default () => {
  const [estimate, setEstimate] = useState(null);
  const [fileRecords, setFileRecords] = useState(null);

  useEffect(() => {
    getAllFileRecords()
      .then(setFileRecords)
      .catch(() => {});
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage
        .estimate()
        .then(setEstimate)
        .catch(() => {});
    }
  }, []);

  if (!localStorageAvailable) {
    return (
      <div className="setting-container setting-container--vertical">
        <div className="setting-label">Storage: localStorage is not available.</div>
      </div>
    );
  }

  const { totalSize, entries } = getLocalStorageUsage();
  const legacyCachedFiles = entries.filter(({ key }) => key.startsWith('files__'));
  const legacyCachedFilesSize = legacyCachedFiles.reduce((sum, { size }) => sum + size, 0);
  const fileRecordsSize = (fileRecords || []).reduce(
    (sum, { contents }) => sum + (contents ? contents.length : 0),
    0
  );
  const writeFailures = getWriteFailures();

  return (
    <div className="setting-container setting-container--vertical storage-diagnostics">
      <div className="setting-label">
        Storage
        <div className="setting-label__description">
          localStorage: {formatCount(totalSize)} characters in {entries.length} keys.
          <br />
          Local file copies in localStorage (old format): {legacyCachedFiles.length},{' '}
          {formatCount(legacyCachedFilesSize)} characters.
          {fileRecords && (
            <>
              <br />
              Local file copies in IndexedDB: {fileRecords.length}, {formatCount(fileRecordsSize)}{' '}
              characters, {fileRecords.filter(({ isDirty }) => isDirty).length} with unsynced
              changes.
            </>
          )}
          {estimate && (
            <>
              <br />
              IndexedDB and other browser storage: {formatBytes(estimate.usage)} of{' '}
              {formatBytes(estimate.quota)}.
            </>
          )}
          <br />
          Failed writes since start: {writeFailures.length}
        </div>
      </div>

      {writeFailures.length > 0 && (
        <ul className="storage-diagnostics__list">
          {writeFailures.map(({ key, valueLength, errorName, errorMessage, at }, index) => (
            <li key={index}>
              {at.toLocaleTimeString()}: {key} ({formatCount(valueLength)} characters):{' '}
              {errorName || errorMessage}
            </li>
          ))}
        </ul>
      )}

      <details className="storage-diagnostics__details">
        <summary>Largest keys</summary>
        <ul className="storage-diagnostics__list">
          {entries.slice(0, LARGEST_KEYS_SHOWN).map(({ key, size }) => (
            <li key={key}>
              {key}: {formatCount(size)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};
