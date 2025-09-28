import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate("/get-started", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const em = email.trim();
    const pw = password;
    if (!em || !pw) {
      toast({ title: "Missing fields", description: "Enter email and password." });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, em, pw);
      toast({ title: "Welcome", description: "Logged in successfully." });
      navigate("/get-started", { replace: true });
    } catch (err: any) {
      const msg = err?.code ? String(err.code).replace("auth/", "").replace(/-/g, " ") : "Login failed";
      toast({ title: "Login error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-transparent flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-center gap-2 text-xl font-extrabold tracking-tight text-black">
          <span className="inline-flex h-10 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">PG</span>
          <span>PaperGen</span>
        </div>
        <div className="rounded-xl border border-input bg-white p-6 sm:p-8 card-yellow-shadow">
          <div className="mb-5 text-center">
            <h1 className="text-2xl font-bold">Log in</h1>
            <p className="text-sm text-muted-foreground">Continue with your email and password</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="input-black bg-black text-white placeholder:text-white/60 focus:bg-black focus-visible:bg-black focus-visible:ring-secondary focus-visible:border-secondary focus:border-secondary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="input-black bg-black text-white placeholder:text-white/60 focus:bg-black focus-visible:bg-black focus-visible:ring-secondary focus-visible:border-secondary focus:border-secondary"
              />
            </div>
            <Button type="submit" className="w-full" variant="secondary" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <div className="text-xs text-muted-foreground mt-4 text-center">
            Accounts are created in Firebase Authentication. No signup here.
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
