import { orgFileExtensions } from '../lib/org_utils';
import { getPersistedField } from '../util/settings_persister';

import { fromJS, Map } from 'immutable';

export const forgejoRepositoryFromURL = (url) => {
  const regex = /(?<domain>.+)\/(?<owner>[^/]+)\/(?<repository>[^/]+)$/;
  const match = url.match(regex);
  if (match) {
    return match.groups;
  }
};

export const contentsResponseToDirectoryListing = (contents) => {
  const isDirectory = (it) => it.type === 'dir';
  return fromJS(
    contents
      .filter((it) => isDirectory(it) || it.name.match(orgFileExtensions))
      .map((it) => ({
        id: it.path,
        name: it.name,
        // Organice requires a leading "/", whereas Forgejo API doesn't
        // use one.
        path: `/${it.path}`,
        isDirectory: isDirectory(it),
      }))
      .sort((a, b) => {
        // Folders first.
        if (a.isDirectory && !b.isDirectory) {
          return -1;
        } else if (!a.isDirectory && b.isDirectory) {
          return 1;
        } else {
          // Can't have same name, so don't need to check if
          // equal/return 0.
          return a.name > b.name ? 1 : -1;
        }
      })
  );
};

function unicodeToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

function base64ToUnicode(base64Str) {
  const binString = atob(base64Str);
  const bytes = Uint8Array.from(binString, (n) => n.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Forgejo sync backend, implemented using their REST API.
 *
 * @see https://forgejo.org/docs/latest/user/api/usage/
 */
export default () => {
  const getRepositoryApi = () =>
    `${getPersistedField('forgejoDomain')}/api/v1/repos/${getPersistedField(
      'forgejoOwner'
    )}/${getPersistedField('forgejoRepository')}`;

  const isSignedIn = async () => {
    const response = await fetch(getRepositoryApi(), {
      method: 'GET',
      headers: {
        Authorization: 'token ' + getPersistedField('forgejoAccessToken'),
      },
    });
    return response.ok;
  };

  const callContentsApi = async (path, method = 'GET', body = null) => {
    const url = `${getRepositoryApi()}/contents${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'token ' + getPersistedField('forgejoAccessToken'),
      },
      body: body == null ? null : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Unexpected response from contents API. Status code: ${response.status}`);
    }
    const data = await response.json();
    return data;
  };

  const getDirectoryListing = async (path) => {
    const data = await callContentsApi(path);
    return {
      listing: contentsResponseToDirectoryListing(data),
      hasMore: false,
      additionalSyncBackendState: Map({}),
    };
  };

  const getMoreDirectoryListing = async (_) => {
    throw Error('not implemented');
  };

  const getFileContentsAndMetadata = async (path) => {
    const file = await callContentsApi(path);
    return {
      contents: base64ToUnicode(file.content),
      lastModifiedAt: file.last_commit_when,
    };
  };

  const getFileContents = async (path) => (await getFileContentsAndMetadata(path)).contents;

  const createFile = async (path, content) => {
    await callContentsApi(path, 'POST', {
      content: unicodeToBase64(content),
      message: `[organice] Create ${path.replace(
        /^\//,
        ''
      )}\n\nAutomatic commit from organice app.`,
    });
  };

  const updateFile = async (path, content) => {
    const currentFile = await callContentsApi(path);
    await callContentsApi(path, 'PUT', {
      content: unicodeToBase64(content),
      sha: currentFile.sha,
      message: `[organice] Update ${path.replace(
        /^\//,
        ''
      )}\n\nAutomatic commit from organice app.`,
    });
  };

  const deleteFile = async (path) => {
    const currentFile = await callContentsApi(path);
    await callContentsApi(path, 'DELETE', {
      sha: currentFile.sha,
      message: `[organice] Delete ${path.replace(
        /^\//,
        ''
      )}\n\nAutomatic commit from organice app.`,
    });
  };

  return {
    type: 'Forgejo',
    isSignedIn,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
