import { fromJS } from 'immutable';
import {
  giteaProjectFromURL,
  parseLinkHeader,
  treeToDirectoryListing,
} from './gitea_sync_backend_client';

test('Parses Gitea project from URL', () => {
  [
    ['https://gitea.example.com/user/repo', { owner: 'user', repo: 'repo' }],
    ['gitea.example.com/org/project', { owner: 'org', repo: 'project' }],
    ['https://git.company.io/team/awesome-app', { owner: 'team', repo: 'awesome-app' }],
    ['gitea.example.com/user-but-no-repo', undefined],
    ['gitea.example.com/user/repo/extra/path', undefined],
    ['', undefined],
  ].forEach(([input, expected]) => {
    expect(giteaProjectFromURL(input)).toEqual(expected);
  });
});

test('Parses Link pagination header', () => {
  [
    [null, {}],
    [
      `<https://foo.local>; rel="first", <https://bar.local>; rel="last"`,
      { first: 'https://foo.local', last: 'https://bar.local' },
    ],
    [
      `<https://gitea.example.com/api/v1/repos/user/repo/contents?page=2>; rel="next"`,
      { next: 'https://gitea.example.com/api/v1/repos/user/repo/contents?page=2' },
    ],
  ].forEach(([input, expected]) => {
    expect(parseLinkHeader(input)).toEqual(expected);
  });
});

describe('Converts file tree to directory listing', () => {
  test('Handles a file', () => {
    expect(
      treeToDirectoryListing([
        {
          name: 'foo.org',
          path: 'somewhere/foo.org',
          sha: '1eabc98234098234',
          type: 'file',
          size: 1234,
        },
      ])
    ).toEqual(
      fromJS([
        {
          id: '1eabc98234098234',
          name: 'foo.org',
          path: '/somewhere/foo.org',
          isDirectory: false,
        },
      ])
    );
  });

  test('Handles a directory', () => {
    expect(
      treeToDirectoryListing([
        {
          name: 'somedir',
          path: 'somedir',
          sha: '1e8eb8723398',
          type: 'dir',
          size: 0,
        },
      ])
    ).toEqual(
      fromJS([
        {
          id: '1e8eb8723398',
          name: 'somedir',
          path: '/somedir',
          isDirectory: true,
        },
      ])
    );
  });

  test('Filters a non-org file', () => {
    expect(
      treeToDirectoryListing([
        {
          name: 'foo.txt',
          path: 'foo.txt',
          sha: '1eabc98234098234',
          type: 'file',
          size: 100,
        },
      ])
    ).toEqual(fromJS([]));
  });

  test('Sorts correctly', () => {
    const data = [
      {
        name: 'mno',
        path: 'mno',
        sha: '93842093',
        type: 'dir',
        size: 0,
      },
      {
        name: 'xyz.org',
        path: 'xyz.org',
        sha: '0921384',
        type: 'file',
        size: 200,
      },
      {
        name: 'abc.org',
        path: 'abc.org',
        sha: '123abc',
        type: 'file',
        size: 150,
      },
    ];
    const names = treeToDirectoryListing(data)
      .toJS()
      .map((it) => it.name);
    expect(names).toEqual(['mno', 'abc.org', 'xyz.org']);
  });
});



