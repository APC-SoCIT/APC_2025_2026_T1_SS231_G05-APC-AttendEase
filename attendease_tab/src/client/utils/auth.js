const ADMIN_SESSION_KEY = 'ae_admin_session';

function dispatchEvent(name, detail) {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

export function isAdminSessionActive() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(active) {
  if (active) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
  dispatchEvent('ae-admin-changed', active);
}

