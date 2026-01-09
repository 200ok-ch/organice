/* global process */

/**
 * WebDAVMockHelper - Mock WebDAV server responses for e2e testing
 *
 * Provides route interception for WebDAV operations to test authenticated
 * flows without needing a real WebDAV server.
 */
class WebDAVMockHelper {
  constructor(page) {
    this.page = page;
    this.mockFiles = new Map();
    this.baseUrl = process.env.REACT_APP_WEBDAV_URL || 'https://example.com/webdav';
  }

  /**
   * Set up route interception for WebDAV operations
   * Call this in test setup to begin mocking
   */
  async setupMocks() {
    const baseUrlPattern = this.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const routePattern = new RegExp(`^${baseUrlPattern}.*`, 'i');

    // Intercept PROPFIND requests (directory listings)
    await this.page.route(routePattern, async (route) => {
      const request = route.request();
      const method = request.method().toUpperCase();
      const url = request.url();

      switch (method) {
        case 'PROPFIND':
          await this.mockDirectoryListing(route, url);
          break;
        case 'GET':
          await this.mockGetFile(route, url);
          break;
        case 'PUT':
          await this.mockPutFile(route, url);
          break;
        case 'DELETE':
          await this.mockDeleteFile(route, url);
          break;
        default:
          // Let other requests fall through
          route.continue();
      }
    });
  }

  /**
   * Mock PROPFIND responses (207 Multi-Status with XML)
   * @param {Route} route - Playwright route object
   * @param {string} url - Request URL
   */
  async mockDirectoryListing(route, url) {
    const path = this.extractPath(url);

    // Check if this is a request for a specific file (stat request)
    // or a directory listing request
    if (this.mockFiles.has(path)) {
      // This is a stat request for a specific file
      // Return metadata for just this file
      const xml = this.generateFileStatXml(path);
      await route.fulfill({
        status: 207,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
        },
        body: xml,
      });
      return;
    }

    // This is a directory listing request
    const files = this.getDirectoryContents(path);
    const xml = this.generatePropfindXml(files, path);

    await route.fulfill({
      status: 207,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: xml,
    });
  }

  /**
   * Mock GET file responses
   * @param {Route} route - Playwright route object
   * @param {string} url - Request URL
   */
  async mockGetFile(route, url) {
    const path = this.extractPath(url);

    if (this.mockFiles.has(path)) {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          ETag: `"${Date.now()}"`,
        },
        body: this.mockFiles.get(path),
      });
    } else {
      await route.fulfill({
        status: 404,
        body: 'File not found',
      });
    }
  }

  /**
   * Mock PUT file responses (store file in memory)
   * @param {Route} route - Playwright route object
   * @param {string} url - Request URL
   */
  async mockPutFile(route, url) {
    const path = this.extractPath(url);
    const content = route.request().postData();

    this.mockFiles.set(path, content);

    await route.fulfill({
      status: 201, // Created
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ETag: `"${Date.now()}"`,
      },
      body: 'Created',
    });
  }

  /**
   * Mock DELETE file responses (remove from memory)
   * @param {Route} route - Playwright route object
   * @param {string} url - Request URL
   */
  async mockDeleteFile(route, url) {
    const path = this.extractPath(url);

    if (this.mockFiles.has(path)) {
      this.mockFiles.delete(path);
      await route.fulfill({
        status: 204, // No Content
      });
    } else {
      await route.fulfill({
        status: 404,
        body: 'File not found',
      });
    }
  }

  /**
   * Add a mock file for testing
   * @param {string} path - File path (relative to WebDAV root)
   * @param {string} content - File content (typically Org mode content)
   */
  addMockFile(path, content) {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    this.mockFiles.set(normalizedPath, content);
  }

  /**
   * Clear all mock files
   * Call this in test teardown or beforeEach
   */
  clearMockFiles() {
    this.mockFiles.clear();
  }

  /**
   * Clear all route handlers
   * Call this in test teardown to ensure clean state between tests
   */
  async clearAllRoutes() {
    await this.page.unrouteAll();
  }

  /**
   * Extract path from full WebDAV URL
   * @param {string} url - Full URL
   * @returns {string} - Path portion
   */
  extractPath(url) {
    try {
      const urlObj = new URL(url);
      const basePath = new URL(this.baseUrl).pathname;
      const fullPath = urlObj.pathname;

      // Remove trailing slashes for comparison
      const basePathNormalized = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
      const fullPathNormalized = fullPath.endsWith('/') ? fullPath.slice(0, -1) : fullPath;

      if (fullPathNormalized.startsWith(basePathNormalized)) {
        const path = fullPath.substring(basePathNormalized.length);
        // Ensure path starts with /
        const result = path.startsWith('/') ? path : '/' + path;
        return result || '/';
      }
      return fullPath;
    } catch {
      return '/';
    }
  }

  /**
   * Get directory contents from mock files
   * @param {string} path - Directory path
   * @returns {Array} - Array of file info objects
   */
  getDirectoryContents(path) {
    const normalizedPath = path === '/' ? '' : path;

    return Array.from(this.mockFiles.entries())
      .filter(([filePath]) => {
        if (normalizedPath === '') {
          // Root directory: show files not in subdirectories
          return !filePath.substring(1).includes('/');
        }
        // Subdirectory: show files under this path
        return (
          filePath.startsWith(normalizedPath) &&
          filePath.substring(normalizedPath.length + 1).indexOf('/') === -1
        );
      })
      .map(([filePath, content]) => ({
        path: filePath,
        name: filePath.split('/').pop(),
        size: content.length,
        lastModified: new Date().toISOString(),
      }));
  }

  /**
   * Generate WebDAV PROPFIND XML response for a single file (stat request)
   * @param {string} path - File path
   * @returns {string} - XML response
   */
  generateFileStatXml(path) {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const href = `${baseUrl}${path.substring(1)}`;
    const content = this.mockFiles.get(path);
    const fileName = path.split('/').pop();

    return `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>${this.escapeXml(href)}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${this.escapeXml(fileName)}</D:displayname>
        <D:getcontentlength>${content.length}</D:getcontentlength>
        <D:getlastmodified>${new Date().toISOString()}</D:getlastmodified>
        <D:resourcetype/>
        <D:getetag>${Date.now()}</D:getetag>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;
  }

  /**
   * Generate WebDAV PROPFIND XML response for directory listing
   * @param {Array} files - Array of file info objects
   * @param {string} path - Request path
   * @returns {string} - XML response
   */
  generatePropfindXml(files, path) {
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;

    const entries = files
      .map((file) => {
        const href = `${baseUrl}${file.path.substring(1)}`;
        return `
        <D:response>
          <D:href>${this.escapeXml(href)}</D:href>
          <D:propstat>
            <D:prop>
              <D:displayname>${this.escapeXml(file.name)}</D:displayname>
              <D:getcontentlength>${file.size}</D:getcontentlength>
              <D:getlastmodified>${file.lastModified}</D:getlastmodified>
              <D:resourcetype/>
            </D:prop>
            <D:status>HTTP/1.1 200 OK</D:status>
          </D:propstat>
        </D:response>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <!-- Self reference -->
  <D:response>
    <D:href>${this.escapeXml(baseUrl + path.substring(1))}</D:href>
    <D:propstat>
      <D:prop>
        <D:displayname>${this.escapeXml(path.split('/').pop() || '/')}</D:displayname>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  ${entries}
</D:multistatus>`;
  }

  /**
   * Escape special XML characters
   * @param {string} str - String to escape
   * @returns {string} - Escaped string
   */
  escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default WebDAVMockHelper;
