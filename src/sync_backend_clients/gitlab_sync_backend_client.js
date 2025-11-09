/* global process */

import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { orgFileExtensions } from '../lib/org_utils';
import { getPersistedField } from '../util/settings_persister';

import { fromJS, Map } from 'immutable';

export const createGitlabOAuth = () => {
  // Use promises as mutex to prevent concurrent token refresh attempts, which causes problems.
  // More info: https://github.com/BitySA/oauth2-auth-code-pkce/issues/29
  // TODO: remove this workaround if/when oauth2-auth-code-pkce fixes the issue.
  let expiryPromise;
  let invalidGrantPromise;
  return new OAuth2AuthCodePKCE({
    authorizationUrl: `https://${getPersistedField('gitLabHost')}/oauth/authorize`,
    tokenUrl: `https://${getPersistedField('gitLabHost')}/oauth/token`,
    clientId: process.env.REACT_APP_GITLAB_CLIENT_ID,
    redirectUrl: window.location.origin,
    scopes: ['api'],
    extraAuthorizationParams: {
      clientSecret: process.env.REACT_APP_GITLAB_SECRET,
    },
    onAccessTokenExpiry: async (refreshToken) => {
      if (!expiryPromise) {
        expiryPromise = refreshToken();
      }
      const result = await expiryPromise;
      expiryPromise = undefined;
      return result;
    },
    onInvalidGrant: async (refreshAuthCodeOrToken) => {
      if (!invalidGrantPromise) {
        invalidGrantPromise = refreshAuthCodeOrToken();
      }
      // This is a void promise, so don't need to return the result. Refer to the TypeScript source
      // of OAuth2AuthCodePKCE. Types are great.
      await invalidGrantPromise;
      invalidGrantPromise = undefined;
    },
  });
};

/**
 * Convert project URL to identifier for use with API, since explaining how to find the ID of a
 * project is unnecessarily confusing for users.
 *
 * @see https://docs.gitlab.com/ee/api/projects.html#get-single-project
 * @param {string} projectURL Full URL for project, such as gitlab.com/foo/bar/baz. Leading https:// is
 * optional.
 * @returns {string|undefined} Project ID if `projectURL` appears to be a gitlab.com project and
 * parsing succeeded, otherwise undefined.
 */
export const gitLabProjectIdFromURL = (projectURL) => {
  if (!projectURL) return;

  if (!projectURL.includes('://')) {
    // URL() class requires protocol.
    projectURL = `https://${projectURL}`;
  }
  try {
    const url = new URL(projectURL);
    const path = url.pathname.replace(/(^\/)|(\/$)/g, '');
    // Rough heuristic to check that url at least *potentially* refers
    // to a project. Reminder: a project path is not necessarily
    // /user/project because it may be under one or more groups such
    // as /user/group/subgroup/project.
    if (path.split('/').length > 1) {
      return [url.hostname, encodeURIComponent(path)];
    } else {
      return undefined;
    }
  } catch (e) {
    console.error('Error trying to get gitLab project_id from URL:');
    console.error(e);
    return undefined;
  }
};

/**
 * Parse 'link' pagination response header.
 *
 * @see https://docs.gitlab.com/ee/api/index.html#keyset-based-pagination
 * @param {string|null} links raw header value
 * @return {Object.<string, string>} Key-value mapping of link name to url. Empty object if none.
 */
export const parseLinkHeader = (links) => {
  if (!links) {
    return {};
  }
  // Based on https://stackoverflow.com/a/48109741
  return links.split(',').reduce((acc, link) => {
    const match = link.match(/<(.*)>; rel="(\w*)"/);
    const url = match[1];
    const rel = match[2];
    acc[rel] = url;
    return acc;
  }, {});
};

/**
 * Converts response from GitLab's list repo tree API into organice format.
 *
 * @see https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
 */
export const treeToDirectoryListing = (tree) => {
  const isDirectory = (it) => it.type === 'tree';
  return fromJS(
    tree
      .filter((it) => isDirectory(it) || it.name.match(orgFileExtensions))
      .map((it) => ({
        id: it.id,
        name: it.name,
        // Organice requires a leading "/", whereas GitLab API doesn't
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

/**
 * GitLab sync backend, implemented using their REST API.
 *
 * @see https://docs.gitlab.com/ee/api/api_resources.html
 * @param {OAuth2AuthCodePKCE} oauthClient
 */
export default (oauthClient) => {
  const decoratedFetch = oauthClient.decorateFetchHTTPClient(fetch);

  const getApiUrl = () => `https://${getPersistedField('gitLabHost')}/api/v4`;

  const getProjectApi = () => `${getApiUrl()}/projects/${getPersistedField('gitLabProject')}`;

  const isSignedIn = async () => {
    if (!oauthClient.isAuthorized()) {
      return false;
    }
    // Verify that we have an OAuth token (and refresh if needed).
    // Don't care about return value, because the library handles
    // persisting for us.
    try {
      await oauthClient.getAccessToken();
      return true;
    } catch (e) {
      console.error('Error trying to get OAuth access token.');
      console.error(e);
      return false;
    }
  };

  /**
   * Check that project exists and user is *probably* able to commit
   * to it. This doesn't take branch protection into consideration, so
   * it's not perfect... but who uses protected branches for the org
   * files?
   *
   * This is separate from `isSignedIn` to avoid the overhead of
   * multiple API calls every time the page is loaded.
   */
  const isProjectAccessible = async () => {
    // Check project exists and user is a member who can *probably*
    // commit.
    const [userResponse, membersResponse] = await Promise.all([
      // https://docs.gitlab.com/ee/api/users.html#list-current-user-for-normal-users
      decoratedFetch(`${getApiUrl()}/user`),
      // https://docs.gitlab.com/ee/api/members.html#list-all-members-of-a-group-or-project
      decoratedFetch(`${getProjectApi()}/members`),
    ]);
    if (!userResponse.ok || !membersResponse.ok) {
      return false;
    }
    const [user, members] = await Promise.all([userResponse.json(), membersResponse.json()]);
    const matched = members.find((m) => m.id === user.id);
    // Access levels:
    // https://docs.gitlab.com/ee/api/members.html#valid-access-levels
    // Permissions:
    // https://docs.gitlab.com/ee/user/permissions.html#project-members-permissions
    // 30 is developer, which is the minimum to commit to a
    // non-protected branch. If branch is protected then they still
    // might be be able to commit, but this is good enough.
    return matched && matched.access_level >= 30;
  };

  let cachedDefaultBranch;
  const getDefaultBranch = async () => {
    if (!cachedDefaultBranch) {
      // https://docs.gitlab.com/ee/api/projects.html#get-single-project
      const response = await decoratedFetch(getProjectApi());
      if (!response.ok) {
        throw new Error(`Unexpected response from project API. Status code: ${response.status}`);
      }
      const body = await response.json();
      cachedDefaultBranch = body.default_branch;
    }
    return cachedDefaultBranch;
  };

  const fetchDirectory = async (url) => {
    const response = await decoratedFetch(url);
    if (!response.ok) {
      throw new Error(`Unexpected response from directory API. Status code: ${response.status}`);
    }
    const pages = parseLinkHeader(response.headers.get('link'));
    const data = await response.json();
    return {
      listing: treeToDirectoryListing(data),
      hasMore: !!pages.next,
      additionalSyncBackendState: Map({
        cursor: pages.next,
      }),
    };
  };

  const getDirectoryListing = async (path) => {
    const params = new URLSearchParams({
      pagination: 'keyset',
      ref: await getDefaultBranch(),
      // Organice requires a leading "/", whereas GitLab API requires
      // there *not* be one.
      path: path.replace(/^\//, ''),
      per_page: 100,
    });
    // https://docs.gitlab.com/ee/api/repositories.html#list-repository-tree
    return await fetchDirectory(`${getProjectApi()}/repository/tree?${params}`);
  };

  const getMoreDirectoryListing = async (additionalSyncBackendState) =>
    await fetchDirectory(additionalSyncBackendState.get('cursor'));

  const getRawFile = async (path) => {
    const params = new URLSearchParams({
      ref: await getDefaultBranch(),
    });
    const encodedPath = encodeURIComponent(path.replace(/^\//, ''));
    // https://docs.gitlab.com/ee/api/repository_files.html#get-raw-file-from-repository
    const response = await decoratedFetch(
      `${getProjectApi()}/repository/files/${encodedPath}/raw?${params}`
    );
    if (!response.ok) {
      throw new Error(`Unexpected response from file API. Status code: ${response.status}`);
    }
    return {
      contents: await response.text(),
      commit: response.headers.get('x-gitlab-last-commit-id'),
    };
  };

  const getCommitDate = async (sha) => {
    // https://docs.gitlab.com/ee/api/commits.html#get-a-single-commit
    const response = await decoratedFetch(
      `${getProjectApi()}/repository/commits/${sha}?stats=false`
    );
    if (!response.ok) {
      throw new Error(`Unexpected response from commit API. Status code: ${response.status}`);
    }
    const body = await response.json();
    // Dates are ISO-8601. Note: while commit date *should* generally
    // be the same as or later than the author date, that isn't
    // guaranteed since history can be rewritten at will. So we pick
    // the newer of the two.
    const committed = new Date(body.committed_date);
    const authored = new Date(body.authored_date);
    // Use Date objects for comparison, but need to return as strings.
    return committed > authored ? committed.toISOString() : authored.toISOString();
  };

  const getFileContentsAndMetadata = async (path) => {
    const file = await getRawFile(path);
    return {
      contents: file.contents,
      lastModifiedAt: await getCommitDate(file.commit),
    };
  };

  // Parentheses are necessarily to await the actual promise. Yay,
  // foot-guns.
  const getFileContents = async (path) => (await getRawFile(path)).contents;

  const doCommit = async (action) => {
    const capitalizedAction = action.action.charAt(0).toUpperCase() + action.action.slice(1);
    // Two newlines because Git commits should have an empty line
    // between title and body.
    const message =
      `[organice] ${capitalizedAction} ${action.file_path}\n\n` +
      'Automatic commit from organice app.';
    // It's also possible to modify files using the files API instead
    // of commits API. For this use case they're about equal, but I
    // picked commits because it doesn't require non-standard encoding
    // for file paths, whereas the files API requires URI encoding
    // plus converting period characters to %2E. Also, the commits API
    // is more flexible in case of future changes, since it allows
    // modifying multiple files at a time.
    //
    // https://docs.gitlab.com/ee/api/commits.html#create-a-commit-with-multiple-files-and-actions
    // https://docs.gitlab.com/ee/api/repository_files.html
    await decoratedFetch(`${getProjectApi()}/repository/commits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: await getDefaultBranch(),
        commit_message: message,
        // Organice only modifies a single file at a time, so only one action.
        actions: [action],
        stats: false,
      }),
    });
  };

  const createFile = async (path, content) => {
    await doCommit({
      action: 'create',
      file_path: path.replace(/^\//, ''),
      content,
    });
  };

  const updateFile = async (path, content) => {
    await doCommit({
      action: 'update',
      file_path: path.replace(/^\//, ''),
      content,
    });
  };

  const deleteFile = async (path) => {
    await doCommit({
      action: 'delete',
      file_path: path.replace(/^\//, ''),
    });
  };

  return {
    type: 'GitLab',
    isSignedIn,
    isProjectAccessible,
    getDirectoryListing,
    getMoreDirectoryListing,
    updateFile,
    createFile,
    getFileContentsAndMetadata,
    getFileContents,
    deleteFile,
  };
};
