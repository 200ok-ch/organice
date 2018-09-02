import exportOrg from './export_org';

export const pushOrgFile = (headers, todoKeywordSets, path, dropboxClient) => (
  dropboxClient.filesUpload({
    path,
    contents: exportOrg(headers, todoKeywordSets),
    mode: {
      '.tag': 'overwrite',
    },
    autorename: true,
  })
);
