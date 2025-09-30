import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  type User,
  signOut,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { getInstitute, saveInstitute, type Institute } from "@/lib/account";
import { Upload, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = React.useState<User | null>(auth.currentUser);
  const [exists, setExists] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const navigate = useNavigate();

  const canConfirmDelete = React.useMemo(
    () => confirmText.trim().toUpperCase() === "DELETE",
    [confirmText],
  );

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    instituteName: "",
    instituteLogo: undefined as string | undefined,
  });

  const lastSavedRef = React.useRef({
    name: "",
    phone: "",
    instituteName: "",
    instituteLogo: undefined as string | undefined,
  });
  const unsubRef = React.useRef<null | (() => void)>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isFormValid = React.useMemo(
    () =>
      form.name.trim().length > 0 &&
      form.phone.trim().length > 0 &&
      form.instituteName.trim().length > 0,
    [form],
  );

  const isEditingRef = React.useRef(isEditing);
  React.useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  React.useEffect(() => {
    if (!confirmOpen) setConfirmText("");
  }, [confirmOpen]);

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
            const inst = getInstitute();
            if (d) {
              const next = {
                name: String(d.name ?? ""),
                phone: String(d.phone ?? ""),
                instituteName: String(d.instituteName ?? inst?.name ?? ""),
                instituteLogo:
                  typeof d.instituteLogo === "string"
                    ? d.instituteLogo
                    : undefined,
              };
              lastSavedRef.current = next;
              setExists(true);
              if (!isEditingRef.current) setForm(next);
              setIsEditing((prev) => (prev ? prev : false));
            } else {
              setExists(false);
              const empty = {
                name: "",
                phone: "",
                instituteName: String(inst?.name ?? ""),
                instituteLogo: undefined,
              };
              lastSavedRef.current = empty;
              if (!isEditingRef.current) setForm(empty);
              setIsEditing((prev) => (prev ? prev : false));
            }
          },
          (err) => {
            console.error(err);
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

  const onSave = async () => {
    if (!user?.uid) {
      toast({
        title: "Not logged in",
        description: "Please sign in first.",
        variant: "destructive",
      });
      return;
    }
    const name = form.name.trim();
    const phone = form.phone.trim();
    const instituteName = form.instituteName.trim();
    const instituteLogo = form.instituteLogo || undefined;

    if (!name || !phone || !instituteName) {
      toast({
        title: "Missing information",
        description: "Name, phone, and institute name are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        instituteName,
        instituteLogo,
        profileCompleted: true,
        updatedAt: Date.now(),
      } as const;
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
      const verify = await getDoc(doc(db, "users", user.uid));
      if (!verify.exists()) throw new Error("Server save verification failed");

      const existingInst: Institute | null = getInstitute();
      const instToSave: Institute = {
        name: instituteName,
        logo: instituteLogo ?? existingInst?.logo,
        type: existingInst?.type,
        address: existingInst?.address,
        city: existingInst?.city,
        contactEmail: existingInst?.contactEmail,
        contactPhone: existingInst?.contactPhone,
        teachersCount: existingInst?.teachersCount,
        website: existingInst?.website,
        registeredAt: existingInst?.registeredAt || Date.now(),
      };
      saveInstitute(instToSave);

      lastSavedRef.current = {
        name,
        phone,
        instituteName,
        instituteLogo,
      };
      setForm({
        name,
        phone,
        instituteName,
        instituteLogo,
      });
      setIsEditing(false);
      setExists(true);
      toast({
        title: "Profile updated successfully",
        description: "Your profile is synced across devices.",
      });
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setForm(lastSavedRef.current);
    setIsEditing(false);
  };

  const onEdit = () => setIsEditing(true);

  const handleLogoChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) {
      toast({
        title: "Logo too large, please upload a smaller file.",
        variant: "destructive",
      });
      e.currentTarget.value = "";
      return;
    }
    const toDataUrl = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
    try {
      const dataUrl = await toDataUrl(file);
      setForm((p) => ({ ...p, instituteLogo: dataUrl }));
    } catch {
      toast({ title: "Failed to load logo", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-svh">
        <Container className="py-6">
          <div className="rounded-xl border border-input bg-white p-6 card-yellow-shadow">
            <p className="text-sm text-muted-foreground">
              Please log in to view your profile.
            </p>
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

              <form
                className="mt-4 space-y-4 max-w-xl"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="grid gap-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Your name"
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-white text-foreground disabled:!opacity-100 disabled:cursor-text"
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="03XX-XXXXXXX"
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-white text-foreground disabled:!opacity-100 disabled:cursor-text"
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="institute">Institute name</Label>
                  <Input
                    id="institute"
                    value={form.instituteName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, instituteName: e.target.value }))
                    }
                    placeholder="Your institute name"
                    disabled={!isEditing}
                    className={
                      !isEditing
                        ? "bg-white text-foreground disabled:!opacity-100 disabled:cursor-text"
                        : undefined
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logo">Institute Logo</Label>
                  <div className="flex items-center gap-4">
                    {form.instituteLogo ? (
                      <img
                        src={form.instituteLogo}
                        alt="Institute Logo Preview"
                        className="h-16 w-16 rounded-md border border-input object-contain bg-white"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md border border-dashed border-input flex items-center justify-center text-xs text-muted-foreground select-none">
                        60×60
                      </div>
                    )}
                    {isEditing && (
                      <>
                        <input
                          id="logo"
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Choose file
                        </Button>
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Max 300KB. PNG or JPG recommended.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !isFormValid}
                        variant="default"
                      >
                        {saving ? (
                          <span className="inline-flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="default" onClick={onEdit}>
                      Edit
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl bg-white p-6 border border-destructive/30 card-yellow-shadow mt-6">
              <h3 className="text-lg font-semibold text-destructive">
                Delete Profile
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This will permanently delete your profile and all your results.
                This action cannot be undone.
              </p>
              <div className="mt-3">
                <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="inline-flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Delete Profile
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your profile?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your profile and all generated results.
                        This action cannot be undone. Type DELETE to confirm.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="mt-4">
                      <Label
                        htmlFor="profile-delete-confirm"
                        className="sr-only"
                      >
                        Type DELETE to confirm
                      </Label>
                      <Input
                        id="profile-delete-confirm"
                        placeholder='Type "DELETE" to confirm'
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        autoComplete="off"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        Enter DELETE in uppercase to enable deletion.
                      </p>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleting}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        disabled={deleting || !canConfirmDelete}
                        onClick={async () => {
                          if (!user?.uid) {
                            toast({
                              title: "Not authenticated",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (!canConfirmDelete) {
                            return;
                          }
                          setDeleting(true);
                          try {
                            // 1) Delete subcollection results in batches of 500
                            const colRef = collection(
                              db,
                              "users",
                              user.uid,
                              "results",
                            );
                            let snap = await getDocs(colRef);
                            while (!snap.empty) {
                              const batch = writeBatch(db);
                              let count = 0;
                              snap.docs.forEach((d) => {
                                batch.delete(d.ref);
                                count++;
                              });
                              await batch.commit();
                              if (count < 500) break;
                              snap = await getDocs(colRef);
                            }
                            // 2) Delete user document
                            await deleteDoc(doc(db, "users", user.uid));
                            // 3) Try to delete auth user (may require re-auth)
                            try {
                              if (auth.currentUser)
                                await deleteUser(auth.currentUser);
                            } catch {}
                            // 4) Sign out and redirect
                            try {
                              await signOut(auth);
                            } catch {}
                            navigate("/login", { replace: true });
                          } catch (e: any) {
                            console.error(e);
                            toast({
                              title: "Delete failed",
                              description: e?.message || "Please try again.",
                              variant: "destructive",
                            });
                          } finally {
                            setDeleting(false);
                            setConfirmOpen(false);
                            setConfirmText("");
                          }
                        }}
                      >
                        {deleting ? (
                          <span className="inline-flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                            Deleting...
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
