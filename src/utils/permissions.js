import api from "../api/axios";

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

// null = never loaded yet (e.g. session created before RBAC existed)
export const getPermissions = () => {
  try {
    const v = JSON.parse(localStorage.getItem("permissions"));
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};

export const isAdmin = () => getUser()?.role === "ADMIN";

export const can = (perm) =>
  isAdmin() || (getPermissions() || []).includes(perm);

export const canAny = (...perms) => perms.some(can);

// { perm, also }: needs ANY of `perm`, and (when given) ANY of `also` as well.
// Used where the server checks two things, e.g. analytics.view + the data it summarises.
export const canAccess = ({ perm, also } = {}) =>
  (!perm || canAny(...[].concat(perm))) && (!also || canAny(...[].concat(also)));

// Pulls the caller's current permissions from the server (throttled to 30s).
export async function refreshPermissions({ force = false } = {}) {
  const last = Number(sessionStorage.getItem("permissionsAt") || 0);
  if (!force && getPermissions() && Date.now() - last < 30000) {
    return getPermissions();
  }

  const { data } = await api.get("/roles/me");
  localStorage.setItem("permissions", JSON.stringify(data.permissions));
  sessionStorage.setItem("permissionsAt", String(Date.now()));

  const user = getUser();
  if (user && (user.role !== data.role || user.roleKey !== data.roleKey)) {
    localStorage.setItem(
      "user",
      JSON.stringify({ ...user, role: data.role, roleKey: data.roleKey }),
    );
  }
  return data.permissions;
}

// Where "Home" in breadcrumbs, and sign-in, should go. Everyone has the same
// dashboard; each card on it only shows data the person is allowed to see.
// First page this person is actually allowed to open (Profile is always open).
const LANDING = [
  ["dashboard.view", "/dashboard"],
  ["mywork.view", "/my-work"],
  ["calendar.view", "/calendar"],
  ["leads.view", "/leads"],
  ["projects.view", "/projects"],
  ["projecttasks.view", "/pm/tasks"],
  ["clients.view", "/clients"],
  ["finance.view", "/finance/dashboard"],
  ["users.view", "/users"],
  ["campaigns.view", "/campaigns"],
];

export const landingPath = () => (LANDING.find(([p]) => can(p)) || [, "/profile"])[1];

export const homePath = () => landingPath();
