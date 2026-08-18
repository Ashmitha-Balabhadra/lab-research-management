import { useEffect, useState } from "react";
import { profileApi } from "../../api/profileApi";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../api/client";

export function ProfilePage({ toast }) {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [form, setForm] = useState({ firstName: "", lastName: "", phoneNumber: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const load = () => {
    setLoading(true);
    profileApi
      .get()
      .then((data) => {
        setProfile(data);
        setForm({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          phoneNumber: data.user.phoneNumber || "",
        });
      })
      .catch((e) => toast(e.message || "Could not load profile.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await profileApi.update(form);
      setUser(updated);
      toast("Profile updated.", "success");
      setEditing(false);
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      toast("New passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await profileApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast("Password changed successfully.", "success");
      setChangingPassword(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading profile…</p>;
  if (!profile) return null;

  const stats = [
    { label: "Total Bookings", value: profile.totalBookings },
    { label: "Completed", value: profile.completedBookings },
    { label: "Cancelled", value: profile.cancelledBookings },
    { label: "No Show", value: profile.noShowBookings },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your personal information and account security.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-bold">
            {(profile.user.firstName?.[0] || "?").toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900">{profile.user.firstName} {profile.user.lastName}</p>
            <p className="text-sm text-slate-500">{profile.user.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{profile.institutionName} · {profile.departmentName}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
              <input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveProfile} disabled={savingProfile} className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 transition-colors">
              Edit Profile
            </button>
            <button onClick={() => setChangingPassword((v) => !v)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 transition-colors">
              Change Password
            </button>
          </div>
        )}

        {changingPassword && !editing && (
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <input type="password" value={pwForm.confirmNewPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmNewPassword: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button onClick={savePassword} disabled={savingPassword} className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
              {savingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
