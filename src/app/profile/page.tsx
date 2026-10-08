"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/navigation/app-shell";
import { createClient } from "@/utils/supabase/client";
import { UserCheck, Mail, Calendar, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface ProfileData {
  full_name: string;
  age: string;
  gender: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    age: "",
    gender: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, age, gender")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            setProfile({
              full_name: data.full_name || user.user_metadata?.full_name || "",
              age: data.age ? String(data.age) : "",
              gender: data.gender || "",
            });
          } else {
            setProfile({
              full_name: user.user_metadata?.full_name || "",
              age: "",
              gender: "",
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: profile.full_name.trim(),
            age: profile.age ? parseInt(profile.age, 10) : null,
            gender: profile.gender,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="glass p-6 sm:p-8 rounded-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Patient Credentials & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Health Profile
          </h1>
          <p className="text-sm text-foreground/70 max-w-xl">
            Manage your personal health attributes to tune biomarker reference ranges.
          </p>
        </div>

        <div className="glass-strong p-6 sm:p-8 rounded-3xl shadow-lg border border-white/40 dark:border-white/10">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5 max-w-xl">
              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 block">
                  Email Address (Account ID)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/40">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass opacity-70 cursor-not-allowed text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="profile-fullname" className="text-xs font-semibold text-foreground/80 block">
                  Full Name
                </label>
                <input
                  id="profile-fullname"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 rounded-2xl glass border border-white/30 dark:border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label htmlFor="profile-age" className="text-xs font-semibold text-foreground/80 block">
                  Age (years)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/40">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="130"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    placeholder="e.g. 34"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass border border-white/30 dark:border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="profile-gender" className="text-xs font-semibold text-foreground/80 block">
                  Biological Sex / Gender
                </label>
                <select
                  id="profile-gender"
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl glass border border-white/30 dark:border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="" className="text-foreground bg-slate-900">Select option</option>
                  <option value="Female" className="text-foreground bg-slate-900">Female</option>
                  <option value="Male" className="text-foreground bg-slate-900">Male</option>
                  <option value="Non-Binary" className="text-foreground bg-slate-900">Non-Binary</option>
                  <option value="Prefer not to say" className="text-foreground bg-slate-900">Prefer not to say</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="glass-button !py-2.5 !px-6 text-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
