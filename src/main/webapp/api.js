// export const token = new URLSearchParams(window.location.search).get('jwt');
// export const url = '/api/v1/';
// export const apiUrl = '/api/v1/';
const devToken = process.env.REACT_APP_API_TOKEN;
export const url = 'http://localhost:8383/api/v1/';
export const apiUrl = 'http://localhost:8383/api/';
export const token = devToken;
