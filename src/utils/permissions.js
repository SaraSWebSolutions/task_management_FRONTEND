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
export const landingPath = () => "/dashboard";

export const homePath = () => landingPath();
