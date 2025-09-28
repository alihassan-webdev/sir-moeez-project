import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import GetStarted from "./pages/GetStarted";
import MCQs from "./pages/MCQs";
import QnA from "./pages/QnA";
import Login from "./pages/Login";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

const queryClient = new QueryClient();

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] bg-background">{children}</div>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading...
        </div>
      </PageWrapper>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isLogin = location.pathname === "/login";
  if (isLanding) {
    return (
      <Routes location={location}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Landing />
            </PageWrapper>
          }
        />
        <Route
          path="*"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
      </Routes>
    );
  }

  return (
    <AppLayout>
      <Routes location={location}>
        <Route
          path="/login"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <PageWrapper>
                <Index />
              </PageWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/get-started"
          element={
            <RequireAuth>
              <PageWrapper>
                <GetStarted />
              </PageWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/mcqs"
          element={
            <RequireAuth>
              <PageWrapper>
                <MCQs />
              </PageWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/qna"
          element={
            <RequireAuth>
              <PageWrapper>
                <QnA />
              </PageWrapper>
            </RequireAuth>
          }
        />
        <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
        <Route
          path="*"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
