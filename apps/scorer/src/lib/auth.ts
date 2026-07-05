const TOKEN_KEY = 'sportsync-token';

export function initAuthFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return;

  localStorage.setItem(TOKEN_KEY, token);
  params.delete('token');
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState({}, '', url.pathname + url.search);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
