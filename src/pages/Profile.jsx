import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import toast from "react-hot-toast";

import { Loader2 } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState({});

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setPageLoading(true);

      const res = await api.get("/profile");
      setProfile(res.data);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setPageLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setProfileLoading(true);

      await api.put("/profile", profile);
      toast.success("Profile Updated Successfully");
    } catch {
      toast.error("Update Failed");
    } finally {
      setProfileLoading(false);
    }
  };

  const changePassword = async () => {
    try {
      setPasswordLoading(true);

      await api.put("/profile/change-password", passwords);

      toast.success("Password Changed");

      setPasswords({
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Password Change Failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader2
              size={50}
              className="animate-spin text-[var(--brand)] mx-auto mb-4"
            />

            <p className="text-slate-600 font-medium text-lg">
              Loading profile...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}

        <div className="bg-gradient-to-r from-[#2b1247] to-[#47216f] rounded-3xl p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-white text-[#2b1247] text-4xl font-bold flex items-center justify-center shadow-lg">
              {profile.name
                ?.split(" ")
                ?.map((n) => n[0])
                ?.join("")
                ?.substring(0, 2)
                ?.toUpperCase()}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white!">{profile.name}</h1>

              <p className="text-purple-200 mt-1 text-start">{profile.email}</p>

              <div className="flex flex-wrap gap-3 mt-4">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    profile.role === "ADMIN"
                      ? "bg-purple-200 text-purple-800"
                      : "bg-blue-200 text-blue-800"
                  }`}
                >
                  {profile.role}
                </span>

                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    profile.status === "ACTIVE"
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {profile.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-slate-500 text-sm">Employee ID</p>
            <h3 className="font-semibold mt-2">
              {profile.employeeId || "N/A"}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-slate-500 text-sm">Department</p>
            <h3 className="font-semibold mt-2">
              {profile.department || "N/A"}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-slate-500 text-sm">Designation</p>
            <h3 className="font-semibold mt-2">
              {profile.designation || "N/A"}
            </h3>
          </div>

          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-slate-500 text-sm">Phone</p>
            <h3 className="font-semibold mt-2">{profile.phone || "N/A"}</h3>
          </div>

          <div className="bg-white rounded-2xl border p-4 shadow-sm">
            <p className="text-slate-500 text-sm">Joining Date</p>
            <h3 className="font-semibold mt-2">
              {profile.joiningDate
                ? new Date(profile.joiningDate).toLocaleDateString()
                : "N/A"}
            </h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Edit Profile */}

          <div className="lg:col-span-2 bg-white rounded-3xl border shadow-sm p-6">
            <h2 className="text-2xl font-bold text-[#2b1247] mb-6">
              Edit Profile
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Employee ID
                </label>

                <input
                  value={profile.employeeId || ""}
                  disabled
                  className="w-full border rounded-xl p-3 bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Full Name
                </label>

                <input
                  value={profile.name || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      name: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Email
                </label>

                <input
                  value={profile.email || ""}
                  disabled
                  className="w-full border rounded-xl p-3 bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Phone
                </label>

                <input
                  value={profile.phone || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      phone: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Department
                </label>

                <input
                  value={profile.department || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      department: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Designation
                </label>

                <select
                  value={profile.designation || "Developer"}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      designation: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                >
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="UI Designer">UI Designer</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Project Manager">Project Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Joining Date
                </label>

                <input
                  type="date"
                  value={
                    profile.joiningDate ? profile.joiningDate.slice(0, 10) : ""
                  }
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      joiningDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-xl p-3"
                />
              </div>
            </div>

            {/* <button
              onClick={saveProfile}
              className="mt-6 bg-[#2b1247] hover:bg-[#1d0d33] text-white px-8 py-3 rounded-xl font-medium"
            >
              Update Profile
            </button> */}
            <button
              onClick={saveProfile}
              disabled={profileLoading}
              className="mt-6 bg-[#2b1247] hover:bg-[#1d0d33] text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {profileLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>

          {/* Change Password */}

          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <h2 className="text-2xl font-bold text-[#2b1247] mb-6">
              Change Password
            </h2>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              <input
                type="password"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    newPassword: e.target.value,
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              {/* <button
                onClick={changePassword}
                className="w-full bg-[#2b1247] hover:bg-[#1d0d33] text-white py-3 rounded-xl font-medium"
              >
                Change Password
              </button> */}
              <button
                onClick={changePassword}
                disabled={passwordLoading}
                className="w-full bg-[#2b1247] hover:bg-[#1d0d33] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
