import { Navigate, useLocation, useParams } from "react-router-dom";

// Clients and Customers are the same people now, so the old client links
// (/clients, /add-client, /edit-client/:id; AddClient and EditClient point here too)
// open the Customers page.
export default function Clients() {
  const { id } = useParams();
  const { pathname } = useLocation();

  if (pathname.replace(/\/+$/, "") === "/add-client") return <Navigate to="/add-customer" replace />;
  if (id) return <Navigate to={`/edit-customer/${id}`} replace />;
  return <Navigate to="/crm/customers" replace />;
}
