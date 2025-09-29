import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getProfile, loadProfile, persistProfile, type UserProfile } from "@/lib/account";
import { Check, Pencil } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>(() => getProfile());

  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    loadProfile().then((remote) => {
      if (!mounted) return;
      setProfile(remote);
      setIsEditing(!remote.profileCompleted);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated: UserProfile = {
        ...profile,
        updatedAt: Date.now(),
        profileCompleted: true,
      };
      await persistProfile(updated);
      setProfile(updated);
      toast({
        title: "Profile saved",
        description: "Your profile has been updated across devices.",
      });
      setIsEditing(false);
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

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  Loading profile...
                </div>
              ) : (
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
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
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
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Your address"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  {isEditing ? (
                    <>
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <span className="inline-flex items-center gap-2"><div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> Saving...</span>
                        ) : (
                          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> {profile.profileCompleted ? "Save Changes" : "Save Profile"}</span>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setProfile(getProfile());
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      variant="elevated"
                    >
                      <span className="inline-flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit Profile</span>
                    </Button>
                  )}
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
