import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  canAny,
  getPermissions,
  isAdmin,
  refreshPermissions,
} from "../utils/permissions";

// <PermissionRoute perm="users.view"> or perm={["a", "b"]} (any of them)
export default function PermissionRoute({ perm, children }) {
  const token = localStorage.getItem("token");
  const [ready, setReady] = useState(() => getPermissions() !== null || isAdmin());

  useEffect(() => {
    if (ready || !token) return;
    refreshPermissions({ force: true })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [ready, token]);

  if (!token) return <Navigate to="/" replace />;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const perms = Array.isArray(perm) ? perm : [perm];
  if (!canAny(...perms)) {
    return <Navigate to={isAdmin() ? "/admin" : "/employee"} replace />;
  }

  return children;
}
