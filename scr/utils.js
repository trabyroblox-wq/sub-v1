// Placeholder for future helpers (host validation, header cleaning, etc.)
export function cleanHeaders(headers) {
  const copy = { ...headers };
  delete copy['proxy-connection'];
  delete copy['proxy-authorization'];
  delete copy['connection'];
  return copy;
}
