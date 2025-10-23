/**
 * CORS Proxy Utility
 * Use this if you need to make requests to external APIs that don't support CORS
 */

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

/**
 * Make a CORS-enabled request to any URL
 * @param {string} url - The URL to request
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const corsFetch = async (url, options = {}) => {
  try {
    const proxyUrl = `${CORS_PROXY}${url}`;
    const response = await fetch(proxyUrl, {
      ...options,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers
      }
    });
    return response;
  } catch (error) {
    console.error('CORS proxy request failed:', error);
    throw error;
  }
};

/**
 * Test if a URL is accessible (for debugging)
 * @param {string} url - URL to test
 */
export const testUrlAccess = async (url) => {
  try {
    const response = await corsFetch(url);
    console.log(`✅ ${url} is accessible:`, response.status);
    return true;
  } catch (error) {
    console.log(`❌ ${url} is not accessible:`, error.message);
    return false;
  }
};
