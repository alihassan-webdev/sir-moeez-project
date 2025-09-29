import * as React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { persistProfile } from "@/lib/account";

export default function Profile() {
  const [user, setUser] = React.useState<User | null>(auth.currentUser);
  const [exists, setExists] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
  });

  const lastSavedRef = React.useRef({ name: "", phone: "" });
  const unsubRef = React.useRef<null | (() => void)>(null);

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      if (u?.uid) {
        const ref = doc(db, "users", u.uid);
        unsubRef.current = onSnapshot(
          ref,
          (snap) => {
            const d = snap.data() as any | undefined;
            if (d) {
              const next = {
                name: String(d.name ?? ""),
                phone: String(d.phone ?? ""),
              };
              lastSavedRef.current = next;
              setExists(true);
              setForm(next);
              setIsEditing(false);
            } else {
              setExists(false);
              const empty = { name: "", phone: "" };
              lastSavedRef.current = empty;
              setForm(empty);
              setIsEditing(true);
            }
          },
          () => {
            toast({
              title: "Error",
              description: "Failed to load profile.",
              variant: "destructive",
            });
          },
        );
      }
    });
    return () => {
      unsubAuth();
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  const waitForUser = async (): Promise<User | null> => {
    if (auth.currentUser) return auth.currentUser;
    return new Promise((resolve) => {
      const off = onAuthStateChanged(auth, (u) => {
        off();
        resolve(u);
      });
      setTimeout(() => {
        try { off(); } catch {}
        resolve(auth.currentUser);
      }, 1500);
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const u = (await waitForUser()) as User | null;
      if (!u?.uid) throw new Error("Not logged in");
      const payload = {
        name: form.name || "",
        phone: form.phone || "",
        profileCompleted: true,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, "users", u.uid), payload, { merge: true });
      lastSavedRef.current = { name: payload.name, phone: payload.phone };
      setIsEditing(false);
      setExists(true);
      toast({ title: "Profile saved", description: "Your profile is synced across devices." });
    } catch (e: any) {
      console.error(e);
      try {
        await persistProfile({
          name: form.name || "",
          email: auth.currentUser?.email || "",
          phone: form.phone || "",
          address: "",
          updatedAt: Date.now(),
          profileCompleted: true,
        } as any);
        lastSavedRef.current = { name: form.name || "", phone: form.phone || "" };
        setIsEditing(false);
        setExists(true);
        toast({ title: "Saved locally", description: "Will sync when online.", });
      } catch (err: any) {
        toast({ title: "Save failed", description: err?.message || e?.message || "Please try again.", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setForm(lastSavedRef.current);
    setIsEditing(false);
  };

  const onEdit = () => setIsEditing(true);

  if (!user) {
    return (
      <div className="min-h-svh">
        <Container className="py-6">
          <div className="rounded-xl border border-input bg-white p-6 card-yellow-shadow">
            <p className="text-sm text-muted-foreground">Please log in to view your profile.</p>
          </div>
        </Container>
      </div>
    );
  }

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
                {exists ? "Your saved details." : "Set up your profile."}
              </p>

              <form className="mt-4 space-y-4 max-w-xl" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="03XX-XXXXXXX"
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted/30" : undefined}
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  {isEditing ? (
                    <>
                      <Button type="button" onClick={onSave} disabled={saving}>
                        {saving ? (
                          <span className="inline-flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="elevated" onClick={onEdit}>
                      Edit
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
