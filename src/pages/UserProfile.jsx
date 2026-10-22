import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import api from "../api/axios";
import { PageHeader, SectionCard, Badge, Avatar, Spinner, GhostButton, PrimaryButton } from "../components/ui";
import { fmtDate, timeAgo } from "../utils/format";
import { can, getUser } from "../utils/permissions";
import { errMsg } from "../constants/userOptions";

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = getUser();

  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get(`/user-management/${id}`), api.get("/user-management/meta")])
      .then(([u, m]) => {
        if (cancelled) return;
        setUser(u.data);
        setMeta(m.data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(errMsg(err, "Failed to load user"));
          navigate("/users");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!user || !meta) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  const role = meta.roles.find((r) => r.key === user.roleKey);
  const all = role?.baseRole === "ADMIN";
  const granted = new Set(all ? [] : [...(role?.permissions || []), ...(user.permissions || [])]);
  const active = user.status !== "INACTIVE";
  const address = [user.address, user.city, user.state, user.zipCode, user.country].filter(Boolean).join(", ");

  const rows = [
    ["Email", user.email],
    ["Phone", user.phone],
    ["Employee ID", user.employeeId],
    ["Department", user.department],
    ["Designation", user.designation],
    ["Date of Birth", user.dob ? fmtDate(user.dob) : ""],
    ["Gender", user.gender],
    ["Address", address],
    ["Join Date", fmtDate(user.joinDate)],
    ["Last Login", timeAgo(user.lastLoginAt)],
  ];

  return (
    <Layout>
      <div className="space-y-6 text-left">
        <PageHeader
          title="User Profile"
          breadcrumbs={[
            { label: "Home", to: me?.role === "ADMIN" ? "/admin" : "/employee" },
            { label: "User Management", to: "/users" },
            { label: user.name },
          ]}
          actions={
            <>
              <GhostButton onClick={() => navigate("/users")}>
                <ArrowLeft size={16} /> Back
              </GhostButton>
              {can("users.edit") && (
                <PrimaryButton onClick={() => navigate(`/users/${id}/edit`)}>
                  <Pencil size={16} /> Edit
                </PrimaryButton>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <section className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="flex justify-center">
              <Avatar name={user.name} src={user.profileImage} size="h-28 w-28" text="text-3xl" />
            </div>
            <p className="mt-4 text-xl font-bold text-slate-900">{user.name}</p>
            <p className="text-slate-500">{user.designation || user.department || ""}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Badge className="bg-violet-100 text-violet-700">{role?.name || user.roleKey}</Badge>
              <Badge className={active ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-600"}>
                {active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </section>

          <div className="xl:col-span-2 space-y-6">
            <SectionCard icon={null} title="Details">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 py-3 border-b border-slate-100">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-slate-900 font-medium text-right break-words max-w-[65%]">{v || "-"}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>

            <SectionCard icon={null} title="Permissions">
              {all && <p className="text-slate-600">Admins have every permission.</p>}
              {!all && granted.size === 0 && <p className="text-slate-500">No module permissions.</p>}
              {!all && granted.size > 0 && (
                <div className="space-y-5">
                  {meta.groups
                    .map((g) => ({ ...g, perms: g.permissions.filter((p) => granted.has(p.key)) }))
                    .filter((g) => g.perms.length)
                    .map((g) => (
                      <div key={g.key}>
                        <p className="font-semibold text-slate-900 mb-2">{g.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {g.perms.map((p) => (
                            <Badge key={p.key} className="bg-emerald-50 text-emerald-600">
                              {p.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
