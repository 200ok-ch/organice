/* global process */
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { isEmpty } from 'lodash';
import { getPersistedField } from '../util/settings_persister';

export const createGitlabOAuth = () =>
  new OAuth2AuthCodePKCE({
    authorizationUrl: 'https://gitlab.com/oauth/authorize',
    tokenUrl: 'https://gitlab.com/oauth/token',
    clientId: process.env.REACT_APP_GITLAB_CLIENT_ID,
    redirectUrl: window.location.origin,
    scopes: ['api'],
    extraAuthorizationParams: {
      clientSecret: process.env.REACT_APP_GITLAB_SECRET,
    },
    onAccessTokenExpiry: (refreshToken) => refreshToken(),
    onInvalidGrant: (refreshAuthCodeOrToken) => refreshAuthCodeOrToken(),
  });

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
  if (!projectURL.includes('://')) {
    // URL() class requires protocol.
    projectURL = `https://${projectURL}`;
  }
  try {
    const url = new URL(projectURL);
    const path = url.pathname.replace(/(^\/)|(\/$)/g, '');
    // Rough heuristic to check that url at least *potentially* refers to a project.
    // Reminder: a project path is not necessarily /user/project because it may be under one or more
    // groups such as /user/group/subgroup/project.
    if (url.hostname === 'gitlab.com' && path.split('/').length > 1) {
      return encodeURIComponent(path);
    } else {
      return undefined;
    }
  } catch {
    return undefined;
  }
};

// TODO implement parsing
// TODO apparently want to use immutable's fromJS
// const treeToDirectoryListing = (tree)

const API_URL = 'https://gitlab.com/api/v4';

/**
 * @param {OAuth2AuthCodePKCE} oauthClient
 */
export default (oauthClient) => {
  const decoratedFetch = oauthClient.decorateFetchHTTPClient(fetch);

  const getProjectId = () => getPersistedField('gitLabProject');

  const isSignedIn = async () => {
    if (!oauthClient.isAuthorized()) {
      return false;
    }
    // Verify that we have an OAuth token (and refresh if needed). Don't care about return value,
    // because the library handles persisting for us.
    try {
      await oauthClient.getAccessToken();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Check that project exists and user is *probably* able to commit to it. This doesn't take branch
   * protection into consideration, so it's not perfect... but who uses protected branches for the
   * org files?
   *
   * This is separate from `isSignedIn` to avoid the overhead of multiple API calls every time the
   * page is loaded.
   */
  const isProjectAccessible = async () => {
    const projectId = getProjectId();
    // Check project exists and user is a member who can *probably* commit.
    const [userResponse, membersResponse] = await Promise.all([
      decoratedFetch(`${API_URL}/user`),
      decoratedFetch(`${API_URL}/projects/${projectId}/members`),
    ]);
    if (!userResponse.ok || !membersResponse.ok) {
      return false;
    }
    const [user, members] = await Promise.all([userResponse.json(), membersResponse.json()]);
    const matched = members.find((m) => m.id === user.id);
    // Access levels: https://docs.gitlab.com/ee/api/members.html#valid-access-levels
    // Permissions: https://docs.gitlab.com/ee/user/permissions.html#project-members-permissions
    // 30 is developer, which is the minimum to commit to a non-protected branch. If branch is
    // protected then they still might be be able to commit, but this is good enough.
    return matched && matched.access_level >= 30;
  };

  const getDirectoryListing = async (path) => {
    // FIXME use path param/finish implementing this
    const project = getProjectId();
    const response = await decoratedFetch(
      `${API_URL}/projects/${project}/repository/tree?pagination=keyset`
    );
    const data = await response.json();
    console.log(data);
    return {
      listing: [],
      hasMore: false,
    };
  };

  // FIXME stub
  const getMoreDirectoryListing = (additionalSyncBackendState) =>
    new Promise((resolve) =>
      resolve({
        listing: [],
        hasMore: false,
      })
    );

  // FIXME stub
  const updateFile = (path, contents) => new Promise((resolve) => resolve());

  // FIXME stub
  const createFile = (path, contents) => new Promise((resolve) => resolve());

  // FIXME stub
  const getFileContentsAndMetadata = (path) =>
    new Promise((resolve) =>
      resolve({
        contents: '* FIXME',
        lastModifiedAt: new Date(),
      })
    );

  // FIXME stub
  const getFileContents = (path) => {
    if (isEmpty(path)) return Promise.reject('No path given');
    return new Promise((resolve, reject) =>
      getFileContentsAndMetadata(path)
        .then(({ contents }) => resolve(contents))
        .catch(reject)
    );
  };

  // FIXME stub
  const deleteFile = (path) => new Promise((resolve) => resolve());

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
