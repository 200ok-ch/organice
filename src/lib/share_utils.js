/**
 * Check if Web Share API is available
 * @returns {boolean} True if Web Share API is supported
 */
export const isWebShareSupported = () => {
  return navigator.share && typeof navigator.share === 'function';
};

/**
 * Share content using Web Share API with fallback
 * @param {Object} options - Share options
 * @param {string} options.title - Title for the share
 * @param {string} options.text - Text content to share
 * @param {string} options.url - URL to share (optional)
 * @param {Array} options.files - Files to share (optional)
 * @returns {Promise<Object>} Result object with success status and method used
 */
export const shareContent = async (options) => {
  const { title, text, url, files } = options;

  if (isWebShareSupported()) {
    try {
      const shareData = {};
      if (title) shareData.title = title;
      if (text) shareData.text = text;
      if (url) shareData.url = url;
      if (files) shareData.files = files;

      await navigator.share(shareData);
      return { success: true, method: 'web-share' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, method: 'web-share', error: 'user-cancelled' };
      }
      // Fall through to fallback
    }
  }

  // Fallback to email
  return fallbackToEmail(options);
};

/**
 * Fallback to email sharing
 * @param {Object} options - Share options
 * @param {string} options.title - Title for the email subject
 * @param {string} options.text - Text content for the email body
 * @returns {Object} Result object
 */
const fallbackToEmail = ({ title, text }) => {
  const subject = title || 'Shared from organice';
  const body = text || '';
  const mailtoURI = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;

  window.open(mailtoURI);
  return { success: true, method: 'email' };
};

/**
 * Create downloadable file
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type of the file (default: 'text/plain')
 */
export const createDownloadableFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
