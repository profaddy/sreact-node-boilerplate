const axios = require('axios');

const adminApi = axios.create({
  basUrl: '',
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
});
module.exports = adminApi;