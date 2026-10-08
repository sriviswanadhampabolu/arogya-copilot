"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/navigation/top-bar";
import { HealthcareDisclaimer } from "@/components/disclaimer";
import { createClient } from "@/utils/supabase/client";
import { UserCheck, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch existing profile if available
        const { data: profile } = await supabase
          .from("profiles")
          .select("age, gender")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.age) setAge(String(profile.age));
          if (profile.gender) setGender(profile.gender);
        }
      } catch {
        // Continue
      } finally {
        setCheckingUser(false);
      }
    }
    verifyAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || Number(age) < 1 || Number(age) > 130) {
      toast.error("Please enter a valid age between 1 and 130");
      return;
    }
    if (!gender) {
      toast.error("Please select a gender option");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            age: parseInt(age, 10),
            gender: gender,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profile details saved!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const genderOptions = ["Female", "Male", "Non-Binary", "Prefer not to say"];

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <TopBar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="glass-strong p-8 sm:p-10 rounded-3xl shadow-xl border border-white/40 dark:border-white/10 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-1">
                <UserCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Personalize Your Health Profile
              </h1>
              <p className="text-sm text-foreground/70 max-w-sm mx-auto">
                Lab reference ranges often vary by age and sex. Setting these helps Arogya provide accurate contextual ranges.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age */}
              <div className="space-y-2">
                <label
                  htmlFor="onboarding-age"
                  className="text-xs font-semibold text-foreground/80 block"
                >
                  Age (years)
                </label>
                <input
                  id="onboarding-age"
                  type="number"
                  min="1"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 34"
                  className="w-full px-4 py-3 rounded-2xl glass border border-white/30 dark:border-white/10 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground/80 block">
                  Biological Sex / Gender
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {genderOptions.map((opt) => {
                    const isSelected = gender === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setGender(opt)}
                        className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-medium transition-all text-center border ${
                          isSelected
                            ? "bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20"
                            : "glass hover:border-teal-500/30 text-foreground/80"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  id="onboarding-submit-btn"
                  disabled={loading}
                  className="glass-button w-full !py-3 font-semibold shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full py-2.5 text-xs text-foreground/60 hover:text-foreground font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-xl mx-auto px-4 pb-6">
        <HealthcareDisclaimer />
      </footer>
    </div>
  );
}
