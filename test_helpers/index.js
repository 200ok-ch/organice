import fs from 'fs';
import path from 'path';

export default function readFixture(name) {
  return fs.readFileSync(path.join(__dirname, `./fixtures/${name}.org`)).toString();
}
