const axios = require('axios');
const config = require('../config');

const directus = axios.create({
  baseURL: config.directus.url,
  headers: {
    Authorization: `Bearer ${config.directus.token}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

const query = async (method, path, data = null, params = {}) => {
  try {
    // Flatten nested objects for Directus (e.g. filter: { email: { _eq: '...' } } -> filter[email][_eq]=...)
    const flattenedParams = {};
    const flatten = (obj, prefix = '') => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}[${key}]` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          flattenedParams[newKey] = value;
        }
      });
    };
    flatten(params);

    const requestConfig = { method, url: path, params: flattenedParams };
    if (data !== null) {
      requestConfig.data = data;
    }
    console.log(`Directus Request: ${method} ${config.directus.url}${path}`, { params: flattenedParams });
    const response = await directus(requestConfig);
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.errors?.[0]?.message || error.message;
    console.error(`Directus error [${method} ${path}] (${status}): ${detail}`);
    if (error.response?.data) {
      console.error('Directus Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(detail);
  }
};

module.exports = {
  query,
  getItems: (collection, params) => query('GET', `/items/${collection}`, null, params),
  getItem: (collection, id, params) => query('GET', `/items/${collection}/${id}`, null, params),
  createItem: (collection, data) => query('POST', `/items/${collection}`, data),
  updateItem: (collection, id, data) => query('PATCH', `/items/${collection}/${id}`, data),
  deleteItem: (collection, id) => query('DELETE', `/items/${collection}/${id}`),
};
