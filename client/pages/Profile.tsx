import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getProfile, saveProfile, type UserProfile } from "@/lib/account";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>(() => getProfile());
  const emailFromAuth = auth.currentUser?.email || profile.email;

  const [saving, setSaving] = React.useState(false);
  const [pwd1, setPwd1] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        email: emailFromAuth,
        updatedAt: Date.now(),
      };
      saveProfile(updated);
      setProfile(updated);
      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
            </div>
          </aside>

          <div>
            <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow mt-4">
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update your personal details.
              </p>

              <form onSubmit={onSubmit} className="mt-4 space-y-4 max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={emailFromAuth}
                    readOnly
                    className="bg-muted/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="03XX-XXXXXXX"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mr-2 align-middle"
                      checked={!!profile.notify}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, notify: e.target.checked }))
                      }
                    />
                    Email notifications
                  </label>
                </div>

                <div className="grid gap-2 pt-2">
                  <Label htmlFor="newpwd">Change password</Label>
                  <Input
                    id="newpwd"
                    type="password"
                    value={pwd1}
                    onChange={(e) => setPwd1(e.target.value)}
                    placeholder="New password"
                  />
                  <Input
                    id="newpwd2"
                    type="password"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!pwd1 || pwd1 !== pwd2 || saving}
                      onClick={async () => {
                        try {
                          const { updatePassword, sendPasswordResetEmail } =
                            await import("firebase/auth");
                          if (!auth.currentUser)
                            throw new Error("Not logged in");
                          if (pwd1 !== pwd2)
                            throw new Error("Passwords do not match");
                          await updatePassword(auth.currentUser, pwd1);
                          setPwd1("");
                          setPwd2("");
                          toast({
                            title: "Password updated",
                            description: "Your password has been changed.",
                          });
                        } catch (err: any) {
                          const code = String(err?.code || "");
                          if (code.includes("requires-recent-login")) {
                            // Fallback: send reset email
                            try {
                              if (auth.currentUser?.email) {
                                const email = auth.currentUser.email;
                                await sendPasswordResetEmail(auth, email);
                                toast({
                                  title: "Verification required",
                                  description:
                                    "We sent a reset link to your email.",
                                });
                              }
                            } catch {}
                          } else {
                            toast({
                              title: "Password update failed",
                              description: err?.message || "Try again.",
                            });
                          }
                        }
                      }}
                    >
                      Update password
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setProfile(getProfile());
                      setPwd1("");
                      setPwd2("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
