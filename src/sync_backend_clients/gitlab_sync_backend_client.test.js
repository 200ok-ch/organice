import { fromJS } from 'immutable';
import {
  gitLabProjectIdFromURL,
  parseLinkHeader,
  treeToDirectoryListing,
} from './gitlab_sync_backend_client';

test('Parses GitLab project from URL', () => {
  [
    ['https://gitlab.com/user/foo', 'user%2Ffoo'],
    ['https://gitlab.com/group/subgroup/project', 'group%2Fsubgroup%2Fproject'],
    ['gitlab.com/foo/bar', 'foo%2Fbar'],
    ['gitlab.com/user-but-no-project', undefined],
    ['', undefined],
  ].forEach(([input, expected]) => {
    expect(gitLabProjectIdFromURL(input)).toEqual(expected);
  });
});

test('Parses GitLab project from URL of a self-managed GitLab instance', () => {
  [
    ['https://mygitlab.com/user/foo', 'user%2Ffoo'],
    ['https://mygitlab.com/group/subgroup/project', 'group%2Fsubgroup%2Fproject'],
    ['mygitlab.com/foo/bar', 'foo%2Fbar'],
    ['mygitlab.com/user-but-no-project', undefined],
    ['https://www.mygitlab.com/user/foo', 'user%2Ffoo'],
    ['https://www.mygitlab.com/group/subgroup/project', 'group%2Fsubgroup%2Fproject'],
    ['www.mygitlab.com/foo/bar', 'foo%2Fbar'],
    ['www.mygitlab.com/user-but-no-project', undefined],
  ].forEach(([input, expected]) => {
    expect(gitLabProjectIdFromURL(input)).toEqual(expected);
  });
});

test('Parses Link pagination header', () => {
  [
    [null, {}],
    [
      `<https://foo.local>; rel="first", <https://bar.local>; rel="last"`,
      { first: 'https://foo.local', last: 'https://bar.local' },
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
          id: '1eabc98234098234',
          name: 'foo.org',
          type: 'blob',
          // Notice that API response has no leading "/" in path, whereas result does.
          path: 'somewhere/foo.org',
          mode: '100644',
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
          id: '1e8eb8723398',
          name: 'somedir',
          type: 'tree',
          path: 'somedir',
          mode: '040000',
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
          id: '1eabc98234098234',
          name: 'foo.txt',
          type: 'blob',
          path: 'foo.txt',
          mode: '100644',
        },
      ])
    ).toEqual(fromJS([]));
  });

  test('Sorts correctly', () => {
    const data = [
      {
        id: '93842093',
        name: 'mno',
        type: 'tree',
        path: 'mno',
        mode: '040000',
      },
      {
        id: '0921384',
        name: 'xyz.org',
        type: 'blob',
        path: 'xyz.org',
        mode: '100644',
      },
      {
        id: '123abc',
        name: 'abc.org',
        type: 'blob',
        path: 'abc.org',
        mode: '100644',
      },
    ];
    const names = treeToDirectoryListing(data)
      .toJS()
      .map((it) => it.name);
    expect(names).toEqual(['mno', 'abc.org', 'xyz.org']);
  });
});
