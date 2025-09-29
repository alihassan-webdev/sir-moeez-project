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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow">
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
                  <Label htmlFor="role">Role / Title</Label>
                  <Input
                    id="role"
                    value={profile.role || ""}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, role: e.target.value }))
                    }
                    placeholder="Teacher / HOD"
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
