/* global globalThis */
import { fromJS } from 'immutable';
import createForgejoSyncBackendClient, {
  base64ToUnicode,
  contentsResponseToDirectoryListing,
  forgejoRepositoriesFromURL,
  unicodeToBase64,
} from './forgejo_sync_backend_client';
import { persistField } from '../util/settings_persister';
import { TextDecoder, TextEncoder } from 'util';

// jsdom lacks the encoding API that browsers provide.
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

describe('Parses Forgejo repository from URL', () => {
  test.each([
    ['https://codeberg.org/owner/repo', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/repo/', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/repo.git', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/repo/src/branch/main', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/repo/issues', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/repo/graph', 'https://codeberg.org', 'owner', 'repo'],
    ['https://codeberg.org/owner/issues', 'https://codeberg.org', 'owner', 'issues'],
    [
      'https://example.com:3000/forgejo/owner/repo',
      'https://example.com:3000/forgejo',
      'owner',
      'repo',
    ],
    ['  https://codeberg.org/owner/repo  ', 'https://codeberg.org', 'owner', 'repo'],
  ])('%s', (url, domain, owner, repository) => {
    expect(forgejoRepositoriesFromURL(url)[0]).toEqual({ domain, owner, repository });
  });

  test('offers the whole path as a later candidate, for a subpath and a route-named repository', () => {
    expect(forgejoRepositoriesFromURL('https://forgejo.example/forgejo/alice/issues')).toEqual([
      { domain: 'https://forgejo.example', owner: 'forgejo', repository: 'alice' },
      { domain: 'https://forgejo.example/forgejo', owner: 'alice', repository: 'issues' },
    ]);
  });

  test.each([[''], ['https://codeberg.org'], ['https://codeberg.org/owner'], ['not a url']])(
    'rejects %p',
    (url) => {
      expect(forgejoRepositoriesFromURL(url)).toEqual([]);
    }
  );
});

describe('Converts contents response to directory listing', () => {
  test('Handles files and directories, filters non-org files and sorts folders first', () => {
    const listing = contentsResponseToDirectoryListing([
      { name: 'xyz.org', path: 'notes/xyz.org', type: 'file' },
      { name: 'readme.md', path: 'notes/readme.md', type: 'file' },
      { name: 'abc.org', path: 'notes/abc.org', type: 'file' },
      { name: 'archive', path: 'notes/archive', type: 'dir' },
    ]);
    expect(listing).toEqual(
      fromJS([
        { id: 'notes/archive', name: 'archive', path: '/notes/archive', isDirectory: true },
        { id: 'notes/abc.org', name: 'abc.org', path: '/notes/abc.org', isDirectory: false },
        { id: 'notes/xyz.org', name: 'xyz.org', path: '/notes/xyz.org', isDirectory: false },
      ])
    );
  });
});

describe('Base64 conversion', () => {
  test('round-trips multi-byte text', () => {
    const text = '* TODO Grüezi 🙏🏻 日本語';
    expect(base64ToUnicode(unicodeToBase64(text))).toEqual(text);
  });

  test('handles large files', () => {
    const text = '* TODO Grüezi 🙏🏻\n'.repeat(100000);
    expect(base64ToUnicode(unicodeToBase64(text))).toEqual(text);
  });
});

describe('Forgejo client', () => {
  const response = (status, body = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    persistField('forgejoDomain', 'https://codeberg.org');
    persistField('forgejoOwner', 'owner');
    persistField('forgejoRepository', 'repo');
    persistField('forgejoAccessToken', 'secret');
    globalThis.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    delete globalThis.fetch;
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('isSignedIn', () => {
    test.each([401, 403, 404])('is signed out when Forgejo answers %i', async (status) => {
      globalThis.fetch.mockResolvedValue(response(status));
      expect(await createForgejoSyncBackendClient().isSignedIn()).toBe(false);
    });

    test.each([500, 502, 503, 429])('stays signed in when Forgejo answers %i', async (status) => {
      globalThis.fetch.mockResolvedValue(response(status));
      expect(await createForgejoSyncBackendClient().isSignedIn()).toBe(true);
    });

    test('stays signed in without network', async () => {
      globalThis.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      expect(await createForgejoSyncBackendClient().isSignedIn()).toBe(true);
    });
  });

  describe('isRepositoryAccessible', () => {
    test('is true when the token may push', async () => {
      globalThis.fetch.mockResolvedValue(response(200, { permissions: { push: true } }));
      expect(await createForgejoSyncBackendClient().isRepositoryAccessible()).toBe(true);
    });

    test('is false when the user may only read', async () => {
      globalThis.fetch.mockResolvedValue(response(200, { permissions: { push: false } }));
      expect(await createForgejoSyncBackendClient().isRepositoryAccessible()).toBe(false);
    });

    test('is false when the token is rejected', async () => {
      globalThis.fetch.mockResolvedValue(response(401));
      expect(await createForgejoSyncBackendClient().isRepositoryAccessible()).toBe(false);
    });
  });

  test('encodes file paths', async () => {
    globalThis.fetch.mockResolvedValue(
      response(200, { content: unicodeToBase64('* foo'), last_commit_when: '2026-10-09T10:00:00Z' })
    );
    await createForgejoSyncBackendClient().getFileContents('/my notes/#1 ?.org');
    expect(globalThis.fetch.mock.calls[0][0]).toEqual(
      'https://codeberg.org/api/v1/repos/owner/repo/contents/my%20notes/%231%20%3F.org'
    );
  });
});
