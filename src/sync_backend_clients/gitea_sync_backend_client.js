import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { orgFileExtensions } from '../lib/org_utils';
import { getPersistedField } from '../util/settings_persister';

import { fromJS, Map } from 'immutable';

export const createGiteaOAuth = () => {
  const giteaURL = getPersistedField('giteaURL');
  if (!giteaURL) {
    throw new Error('Gitea URL not configured');
  }

  // Use promises as mutex to prevent concurrent token refresh attempts, which causes problems.
  // More info: https://github.com/BitySA/oauth2-auth-code-pkce/issues/29
  // TODO: remove this workaround if/when oauth2-auth-code-pkce fixes the issue.
  let expiryPromise;
  let invalidGrantPromise;
  return new OAuth2AuthCodePKCE({
    authorizationUrl: `${giteaURL}/login/oauth/authorize`,
    tokenUrl: `${giteaURL}/login/oauth/access_token`,
    clientId: getPersistedField('giteaClientId'),
    redirectUrl: window.location.origin,
    // Gitea OAuth scopes - empty array grants full access to authorized resources
    // Specific scopes like 'write:repository' can be added if needed
    scopes: [],
    extraAuthorizationParams: {
      clientSecret: getPersistedField('giteaClientSecret'),
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
 * Convert project URL to owner/repo format for use with API.
 *
 * @param {string} projectURL Full URL for project, such as gitea.example.com/owner/repo. Leading https:// is
 * optional.
 * @returns {Object|undefined} Object with owner and repo if parsing succeeded, otherwise undefined.
 */
export const giteaProjectFromURL = (projectURL) => {
  if (!projectURL) return;

  if (!projectURL.includes('://')) {
    // URL() class requires protocol.
    projectURL = `https://${projectURL}`;
  }
  try {
    const url = new URL(projectURL);
    const path = url.pathname.replace(/(^\/)|(\/$)/g, '');
    const parts = path.split('/');
    // Gitea repos are always owner/repo (no nested groups like GitLab)
    if (parts.length === 2 && parts[0] && parts[1]) {
      return {
        owner: parts[0],
        repo: parts[1],
      };
    } else {
      return undefined;
    }
  } catch (e) {
    console.error('Error trying to get Gitea project from URL:');
    console.error(e);
    return undefined;
  }
};

/**
 * Parse 'link' pagination response header.
 *
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
    if (match) {
      const url = match[1];
      const rel = match[2];
      acc[rel] = url;
    }
    return acc;
  }, {});
};

/**
 * Converts response from Gitea's list repo tree API into organice format.
 *
 * @see https://docs.gitea.io/en-us/api-usage/#listing-contents-of-a-repository
 */
export const treeToDirectoryListing = (tree) => {
  const isDirectory = (it) => it.type === 'dir';
  return fromJS(
    tree
      .filter((it) => isDirectory(it) || it.name.match(orgFileExtensions))
      .map((it) => ({
        id: it.sha,
        name: it.name,
        // Organice requires a leading "/", whereas Gitea API doesn't
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
 * Gitea sync backend, implemented using their REST API.
 *
 * @see https://docs.gitea.io/en-us/api-usage/
 * @param {OAuth2AuthCodePKCE} oauthClient
 */
export default (oauthClient) => {
  const decoratedFetch = oauthClient.decorateFetchHTTPClient(fetch);

  const getGiteaURL = () => getPersistedField('giteaURL');
  const getAPIURL = () => `${getGiteaURL()}/api/v1`;
  const getProject = () => {
    const projectString = getPersistedField('giteaProject');
    return projectString ? JSON.parse(projectString) : null;
  };
  const getProjectApi = () => {
    const project = getProject();
    return `${getAPIURL()}/repos/${project.owner}/${project.repo}`;
  };

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
   * Check that repository exists and user has access to it.
   *
   * This is separate from `isSignedIn` to avoid the overhead of
   * multiple API calls every time the page is loaded.
   */
  const isProjectAccessible = async () => {
    try {
      // https://docs.gitea.io/en-us/api-usage/#get-a-repository
      const response = await decoratedFetch(getProjectApi());
      if (!response.ok) {
        return false;
      }
      const repo = await response.json();
      // Check if user has push permission
      return repo.permissions && repo.permissions.push === true;
    } catch (e) {
      console.error('Error checking project accessibility:');
      console.error(e);
      return false;
    }
  };

  let cachedDefaultBranch;
  const getDefaultBranch = async () => {
    // Always check if user configured a specific branch (don't cache this check)
    const configuredBranch = getPersistedField('giteaBranch', true);
    
    // If configured branch exists, use it
    if (configuredBranch) {
      return configuredBranch;
    }
    
    // Otherwise, fetch and cache the repository's default branch
    if (!cachedDefaultBranch) {
      // https://docs.gitea.io/en-us/api-usage/#get-a-repository
      const response = await decoratedFetch(getProjectApi());
      if (!response.ok) {
        throw new Error(`Unexpected response from repository API. Status code: ${response.status}`);
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
      ref: await getDefaultBranch(),
    });
    // Organice requires a leading "/", whereas Gitea API requires
    // there *not* be one.
    const cleanPath = path.replace(/^\//, '');
    // https://docs.gitea.io/en-us/api-usage/#listing-contents-of-a-repository
    // Use /contents/{path} format, not query parameter
    const endpoint = cleanPath 
      ? `${getProjectApi()}/contents/${cleanPath}?${params}`
      : `${getProjectApi()}/contents?${params}`;
    return await fetchDirectory(endpoint);
  };

  const getMoreDirectoryListing = async (additionalSyncBackendState) =>
    await fetchDirectory(additionalSyncBackendState.get('cursor'));

  const getRawFile = async (path) => {
    const params = new URLSearchParams({
      ref: await getDefaultBranch(),
    });
    const cleanPath = path.replace(/^\//, '');
    // https://docs.gitea.io/en-us/api-usage/#get-contents
    const response = await decoratedFetch(`${getProjectApi()}/contents/${cleanPath}?${params}`);
    if (!response.ok) {
      throw new Error(`Unexpected response from file API. Status code: ${response.status}`);
    }
    const data = await response.json();
    
    // Get the last commit for this file
    const commitsParams = new URLSearchParams({
      sha: await getDefaultBranch(),
      path: cleanPath,
      per_page: 1, // Changed from 'limit' to 'per_page' (GitHub/Gitea API standard)
    });
    const commitsResponse = await decoratedFetch(`${getProjectApi()}/commits?${commitsParams}`);
    if (!commitsResponse.ok) {
      throw new Error(`Unexpected response from commits API. Status code: ${commitsResponse.status}`);
    }
    const commits = await commitsResponse.json();
    const lastCommitSha = commits.length > 0 ? commits[0].sha : null;
    
    // Gitea returns base64 encoded content - decode properly for UTF-8
    const contents = decodeURIComponent(escape(atob(data.content)));
    return {
      contents,
      commit: lastCommitSha,
      blobSha: data.sha, // The blob SHA is needed for update/delete operations
    };
  };

  const getCommitDate = async (sha) => {
    if (!sha) {
      throw new Error('Cannot get commit date: commit SHA is null or undefined');
    }
    // https://docs.gitea.io/en-us/api-usage/#get-a-single-commit
    // Use /git/commits/{sha} endpoint for getting commit details
    const response = await decoratedFetch(`${getProjectApi()}/git/commits/${sha}`);
    if (!response.ok) {
      throw new Error(`Unexpected response from commit API. Status code: ${response.status}`);
    }
    const body = await response.json();
    // Gitea returns commit info with author and committer dates nested under 'commit'
    const committed = new Date(body.commit.committer.date);
    const authored = new Date(body.commit.author.date);
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

  const createFile = async (path, content) => {
    const message = `[organice] Create ${path}\n\nAutomatic commit from organice app.`;
    const cleanPath = path.replace(/^\//, '');
    // https://docs.gitea.io/en-us/api-usage/#create-a-file
    // Note: Gitea uses PUT for both create and update (GitHub-compatible API)
    const response = await decoratedFetch(`${getProjectApi()}/contents/${cleanPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: await getDefaultBranch(),
        message,
        content: btoa(unescape(encodeURIComponent(content))), // Proper UTF-8 to base64 encoding
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create file. Status code: ${response.status}`);
    }
  };

  const updateFile = async (path, content) => {
    const message = `[organice] Update ${path}\n\nAutomatic commit from organice app.`;
    const cleanPath = path.replace(/^\//, '');
    // Need to get the current file blob SHA for update
    const file = await getRawFile(path);
    // https://docs.gitea.io/en-us/api-usage/#update-a-file
    const response = await decoratedFetch(`${getProjectApi()}/contents/${cleanPath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: await getDefaultBranch(),
        message,
        sha: file.blobSha, // Use blob SHA, not commit SHA
        content: btoa(unescape(encodeURIComponent(content))), // Proper UTF-8 to base64 encoding
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update file. Status code: ${response.status}`);
    }
  };

  const deleteFile = async (path) => {
    const message = `[organice] Delete ${path}\n\nAutomatic commit from organice app.`;
    const cleanPath = path.replace(/^\//, '');
    // Need to get the current file blob SHA for deletion
    const file = await getRawFile(path);
    // https://docs.gitea.io/en-us/api-usage/#delete-a-file
    const response = await decoratedFetch(`${getProjectApi()}/contents/${cleanPath}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch: await getDefaultBranch(),
        message,
        sha: file.blobSha, // Use blob SHA, not commit SHA
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete file. Status code: ${response.status}`);
    }
  };

  return {
    type: 'Gitea',
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

