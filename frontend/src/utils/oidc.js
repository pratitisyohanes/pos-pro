// Login through KandangID (OpenID Connect, authorization code + PKCE).
// Turned on only when VITE_SSO_URL and VITE_SSO_CLIENT_ID are set; otherwise the old login form is used.
const SSO_URL = (import.meta.env.VITE_SSO_URL || '').replace(/\/+$/, '');
const CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || '';
const STORAGE_KEY = 'kandangid-login';

// Loop guard for the automatic redirect on /login: if KandangID signs the user in but the API still refuses the token,
// the browser would bounce between the two forever. After 3 starts within 30 seconds the login page stops and shows a button.
const AUTO_START_KEY = 'kandangid-auto-starts';
const AUTO_START_LIMIT = 3;
const AUTO_START_WINDOW_MS = 30_000;

export const isSsoEnabled = Boolean(SSO_URL && CLIENT_ID);

// Records this automatic start and says whether it may go ahead
export const allowAutoStart = () => {
  const now = Date.now();
  const recent = JSON.parse(sessionStorage.getItem(AUTO_START_KEY) || '[]').filter((time) => now - time < AUTO_START_WINDOW_MS);
  recent.push(now);
  sessionStorage.setItem(AUTO_START_KEY, JSON.stringify(recent));
  return recent.length <= AUTO_START_LIMIT;
};

// Must match the redirect_uris registered with: npm run client:web (sso-pro)
const redirectUri = () => `${window.location.origin}/login/callback`;

const base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const randomString = (size = 32) => base64url(crypto.getRandomValues(new Uint8Array(size)));

const decodeClaims = (jwt) => {
  const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(part))));
};

// Step 1: remember verifier, state and nonce in this tab, then leave for the KandangID login page
export const startLogin = async ({ returnTo = '/', prompt } = {}) => {
  const verifier = randomString();
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = randomString(16);
  const nonce = randomString(16);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ verifier, state, nonce, returnTo }));

  const url = new URL(`${SSO_URL}/oidc/authorize`);
  const params = {
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    ...(prompt && { prompt }),
  };
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  // replace() keeps /login out of the history, so the back button does not send the browser straight to KandangID again
  window.location.replace(url.toString());
};

const tokenRequest = async (params) => {
  const response = await fetch(`${SSO_URL}/oidc/token`, {
    method: 'POST',
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error_description || 'Login failed, please try again');
  return body;
};

// Same shape as the old /auth/login answer, so the auth store and API client need no other change
const toSession = (tokens) => {
  const claims = decodeClaims(tokens.id_token);
  return {
    user: { id: claims.sub, name: claims.name, email: claims.email, role: claims.role },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
};

// Step 2: back on /login/callback?code&state; check state, exchange the code with the verifier, check nonce
export const finishLogin = async (search) => {
  const params = new URLSearchParams(search);
  const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
  sessionStorage.removeItem(STORAGE_KEY);

  if (params.get('error')) throw new Error(params.get('error_description') || 'Login was cancelled');
  if (!saved || params.get('state') !== saved.state) throw new Error('This login link has expired, please try again');

  const tokens = await tokenRequest({ grant_type: 'authorization_code', code: params.get('code'), code_verifier: saved.verifier, redirect_uri: redirectUri() });
  if (decodeClaims(tokens.id_token).nonce !== saved.nonce) throw new Error('Login answer does not belong to this request');

  return { session: toSession(tokens), returnTo: saved.returnTo };
};

// Refresh tokens are rotated by KandangID: every call returns a new pair
export const refreshWithSso = async (refreshToken) => toSession(await tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken }));

// Ends the KandangID session too, so the other app also needs a new login
export const ssoLogoutUrl = () =>
  `${SSO_URL}/oidc/logout?${new URLSearchParams({ client_id: CLIENT_ID, post_logout_redirect_uri: `${window.location.origin}/` })}`;
