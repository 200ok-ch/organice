#!/usr/bin/env node

/* global process */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CIRCLE_SHA1 = process.env.CIRCLE_SHA1;
const OWNER = process.env.CIRCLE_PROJECT_USERNAME;
const REPO = process.env.CIRCLE_PROJECT_REPONAME;

// Parse command line arguments
const args = process.argv.slice(2);
let name = 'Test Results';
let filePath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name') {
    name = args[i + 1];
    i++;
  } else if (args[i] === '--file') {
    filePath = args[i + 1];
    i++;
  }
}

if (!filePath) {
  console.error('Usage: ./bin/post_test_results.js --name "Check Name" --file path/to/results.xml');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.log(`Test results file not found at ${filePath}. Skipping GitHub Check creation.`);
  process.exit(0);
}

if (!GITHUB_TOKEN) {
  console.warn('GITHUB_TOKEN not found. Skipping GitHub Check creation.');
  process.exit(0);
}

if (!CIRCLE_SHA1 || !OWNER || !REPO) {
  console.warn('CircleCI environment variables (CIRCLE_SHA1, CIRCLE_PROJECT_USERNAME, CIRCLE_PROJECT_REPONAME) missing. Skipping.');
  process.exit(0);
}

console.log(`Processing test results for ${name} from ${filePath}...`);

const xmlData = fs.readFileSync(filePath, 'utf8');
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ''
});
const result = parser.parse(xmlData);

const annotations = [];
let failureCount = 0;
let totalCount = 0;

function processTestSuite(suite) {
  const testCases = Array.isArray(suite.testcase) ? suite.testcase : (suite.testcase ? [suite.testcase] : []);

  testCases.forEach(testCase => {
    totalCount++;
    if (testCase.failure) {
      failureCount++;
      const failure = Array.isArray(testCase.failure) ? testCase.failure[0] : testCase.failure;
      const message = failure.message || failure['#text'] || 'Test failed';
      const rawDetails = failure['#text'] || failure.message || '';

      // Attempt to extract file path and line number
      // Jest-junit with usePathForSuiteName: true puts file path in classname
      let relPath = testCase.classname || 'unknown';

      // Clean up path if it looks like a path
      if (relPath.startsWith(process.cwd())) {
        relPath = path.relative(process.cwd(), relPath);
      }

      // Fallback for Playwright or other formats if classname isn't a file
      if (testCase.file) {
          relPath = testCase.file;
      }

      // Try to extract line number from stack trace or message
      // Jest stack trace often looks like: "at Object.<anonymous> (/path/to/file.js:12:34)"
      let startLine = 1;
      const stackMatch = rawDetails.match(/:(\d+):\d+/);
      if (stackMatch) {
        startLine = parseInt(stackMatch[1], 10);
      }

      // GitHub annotation
      annotations.push({
        path: relPath,
        start_line: startLine,
        end_line: startLine,
        annotation_level: 'failure',
        title: testCase.name,
        message: message.substring(0, 200) + (message.length > 200 ? '...' : ''), // Truncate for safety
        raw_details: rawDetails.substring(0, 60000) // GitHub limit is 64kb usually
      });
    }
  });

  // Recursively process nested suites if any
  const nestedSuites = Array.isArray(suite.testsuite) ? suite.testsuite : (suite.testsuite ? [suite.testsuite] : []);
  nestedSuites.forEach(processTestSuite);
}

// Handle root testsuites or single testsuite
const rootSuites = Array.isArray(result.testsuites?.testsuite)
  ? result.testsuites.testsuite
  : (result.testsuites?.testsuite ? [result.testsuites.testsuite] : (result.testsuite ? [result.testsuite] : []));

rootSuites.forEach(processTestSuite);

const conclusion = failureCount > 0 ? 'failure' : 'success';
const title = `${name}: ${failureCount} failed of ${totalCount}`;
const summary = `Found ${failureCount} failures out of ${totalCount} tests in ${filePath}.`;

console.log(`Sending Check Run: ${title}`);

// Batch annotations (GitHub API limit is 50 per request)
const BATCH_SIZE = 50;

async function postCheckRun() {
  const checkRunData = {
    name: name,
    head_sha: CIRCLE_SHA1,
    status: 'completed',
    conclusion: conclusion,
    output: {
      title: title,
      summary: summary,
      annotations: annotations.slice(0, BATCH_SIZE) // First 50
    }
  };

  try {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/check-runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'organice-circleci-reporter'
      },
      body: JSON.stringify(checkRunData)
    });

    if (!response.ok) {
      console.error(`Failed to create check run: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(text);
    } else {
      const data = await response.json();
      console.log(`Check run created: ${data.html_url}`);

      // If we have more annotations, we technically should update the check run,
      // but for "Land the Plane" simpler is better. 50 is usually enough to see what's broken.
      if (annotations.length > BATCH_SIZE) {
          console.warn(`Note: Only first 50 annotations posted (Total: ${annotations.length}).`);
      }
    }
  } catch (error) {
    console.error('Error posting to GitHub:', error);
  }
}

postCheckRun();
