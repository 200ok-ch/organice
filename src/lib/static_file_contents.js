/* global process */

export const sampleFileContents = JSON.parse(process.env.REACT_APP_SAMPLE_FILE_CONTENTS || '""');

export const changelogFileContents = JSON.parse(process.env.REACT_APP_CHANGELOG_FILE_CONTENTS || '""');
