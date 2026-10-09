import { orgFileExtensions } from '../lib/org_utils';
import { getPersistedField } from '../util/settings_persister';

import { fromJS, Map } from 'immutable';

// First path segments of Forgejo pages below a repository, such as
// /owner/repo/src/branch/main.
const REPOSITORY_ROUTES = [
  'actions',
  'activity',
  'blame',
  'branches',
  'commit',
  'commits',
  'compare',
  'issues',
  'labels',
  'media',
  'milestones',
  'projects',
  'pulls',
  'raw',
  'releases',
  'settings',
  'src',
  'tags',
  'wiki',
];

/**
 * Parse the URL of a repository, or of any page in it, as copied from the
 * browser. A path in front of owner and repository belongs to the domain, for
 * Forgejo instances served from a subpath.
 *
 * @param {string} input Such as https://codeberg.org/owner/repo
 * @returns {{domain: string, owner: string, repository: string}|undefined}
 */
export const forgejoRepositoryFromURL = (input) => {
  let url;
  try {
    url = new URL(input.trim());
  } catch {
    return;
  }
  const segments = url.pathname.split('/').filter(Boolean);
  const routeIndex = segments.findIndex(
    (segment, index) => index >= 2 && REPOSITORY_ROUTES.includes(segment)
  );
  const repositoryPath = routeIndex === -1 ? segments : segments.slice(0, routeIndex);
  if (repositoryPath.length < 2) {
    return;
  }
  const [owner, repository] = repositoryPath.slice(-2);
  return {
    domain: [url.origin, ...repositoryPath.slice(0, -2)].join('/'),
    owner,
    repository: repository.replace(/\.git$/, ''),
  };
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

export function unicodeToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  // Not `String.fromCodePoint(...bytes)`: spreading a large file exceeds the
  // maximum number of function arguments.
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

export function base64ToUnicode(base64Str) {
  const binString = atob(base64Str);
  const bytes = Uint8Array.from(binString, (n) => n.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Forgejo sync backend, implemented using their REST API.
 *
 * @see https://forgejo.org/docs/latest/user/api/usage/
 */
const SIGNED_OUT_STATUSES = [401, 403, 404];

export default () => {
  const getRepositoryApi = () =>
    `${getPersistedField('forgejoDomain')}/api/v1/repos/${getPersistedField(
      'forgejoOwner'
    )}/${getPersistedField('forgejoRepository')}`;

  const authorizationHeader = () => ({
    Authorization: 'token ' + getPersistedField('forgejoAccessToken'),
  });

  const fetchRepository = () => fetch(getRepositoryApi(), { headers: authorizationHeader() });

  const isSignedIn = async () => {
    try {
      const response = await fetchRepository();
      // Only Forgejo rejecting the token or the repository means signed
      // out. Signing out deletes the local copies, so a server that can't
      // be reached (e.g. while offline) must not.
      if (SIGNED_OUT_STATUSES.includes(response.status)) {
        return false;
      }
      if (!response.ok) {
        console.warn(`Unexpected response from Forgejo. Status code: ${response.status}`);
      }
      return true;
    } catch (e) {
      console.warn('Could not reach Forgejo', e);
      return true;
    }
  };

  /**
   * Check that the repository exists and the access token may push to it.
   */
  const isRepositoryAccessible = async () => {
    try {
      const response = await fetchRepository();
      if (!response.ok) {
        return false;
      }
      const repository = await response.json();
      return !!(repository.permissions && repository.permissions.push);
    } catch (e) {
      console.error('Could not reach Forgejo', e);
      return false;
    }
  };

  const callContentsApi = async (path, method = 'GET', body = null) => {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${getRepositoryApi()}/contents${encodedPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeader(),
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

  // Two newlines because Git commits should have an empty line between
  // title and body.
  const commitMessage = (action, path) =>
    `[organice] ${action} ${path.replace(/^\//, '')}\n\nAutomatic commit from organice app.`;

  // Forgejo requires the blob SHA of the file that an update or delete
  // replaces.
  const createFile = async (path, content) => {
    await callContentsApi(path, 'POST', {
      content: unicodeToBase64(content),
      message: commitMessage('Create', path),
    });
  };

  const updateFile = async (path, content) => {
    const currentFile = await callContentsApi(path);
    await callContentsApi(path, 'PUT', {
      content: unicodeToBase64(content),
      sha: currentFile.sha,
      message: commitMessage('Update', path),
    });
  };

  const deleteFile = async (path) => {
    const currentFile = await callContentsApi(path);
    await callContentsApi(path, 'DELETE', {
      sha: currentFile.sha,
      message: commitMessage('Delete', path),
    });
  };

  return {
    type: 'Forgejo',
    isSignedIn,
    isRepositoryAccessible,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
