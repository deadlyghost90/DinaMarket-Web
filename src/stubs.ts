// Safe browser stubs for node-fetch and formdata-polyfill
export const fetch = typeof window !== "undefined" ? window.fetch.bind(window) : undefined;
export const Headers = typeof window !== "undefined" ? window.Headers : undefined;
export const Request = typeof window !== "undefined" ? window.Request : undefined;
export const Response = typeof window !== "undefined" ? window.Response : undefined;
export const FormData = typeof window !== "undefined" ? window.FormData : undefined;

export default fetch;
