/* global process */

export const sampleFileContents = JSON.parse(process.env.REACT_APP_SAMPLE_FILE_CONTENTS || '""');

export const whatsNewFileContents = JSON.parse(process.env.REACT_APP_WHATS_NEW_FILE_CONTENTS || '""');
