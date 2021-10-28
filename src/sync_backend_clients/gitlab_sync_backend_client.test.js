import { gitLabProjectIdFromURL } from './gitlab_sync_backend_client';

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
