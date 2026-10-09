import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FixtureHelper {
  readOrgFixture(fixtureName) {
    const fixturePath = path.join(__dirname, '../../test_helpers/fixtures', `${fixtureName}.org`);
    if (fs.existsSync(fixturePath)) {
      return fs.readFileSync(fixturePath, 'utf-8');
    }
    return null;
  }

  getAvailableFixtures() {
    const fixturesDir = path.join(__dirname, '../../test_helpers/fixtures');
    if (!fs.existsSync(fixturesDir)) {
      return [];
    }
    return fs
      .readdirSync(fixturesDir)
      .filter((file) => file.endsWith('.org'))
      .map((file) => file.replace('.org', ''));
  }

  createTempOrgFile(content) {
    const tempDir = path.join(__dirname, '../fixtures/temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempPath = path.join(tempDir, `test-${Date.now()}.org`);
    fs.writeFileSync(tempPath, content);
    return tempPath;
  }

  cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../fixtures/temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

export default FixtureHelper;
