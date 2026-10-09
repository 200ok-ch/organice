import { createClient } from 'webdav';
import createWebDAVSyncBackendClient from './webdav_sync_backend_client';

jest.mock('webdav', () => ({ createClient: jest.fn() }));

describe('isSignedIn', () => {
  const clientFailingWith = (error) => {
    createClient.mockReturnValue({ getDirectoryContents: () => Promise.reject(error) });
    return createWebDAVSyncBackendClient('https://example.com/webdav', 'u', 'p');
  };

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('is signed in when the root folder can be read', async () => {
    createClient.mockReturnValue({ getDirectoryContents: () => Promise.resolve([]) });
    const client = createWebDAVSyncBackendClient('https://example.com/webdav', 'u', 'p');
    expect(await client.isSignedIn()).toBe(true);
  });

  test('stays signed in when the server cannot be reached', async () => {
    expect(await clientFailingWith(new Error('Network Error')).isSignedIn()).toBe(true);
  });

  test('stays signed in on a server error', async () => {
    const error = Object.assign(new Error('Request failed'), { response: { status: 503 } });
    expect(await clientFailingWith(error).isSignedIn()).toBe(true);
  });

  test.each([401, 403, 404])('is signed out when the server answers %i', async (status) => {
    const error = Object.assign(new Error('Request failed'), { response: { status } });
    expect(await clientFailingWith(error).isSignedIn()).toBe(false);
  });
});
