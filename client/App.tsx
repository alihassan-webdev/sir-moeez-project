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
import React, { useEffect, useState, Suspense } from "react";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
const Index = React.lazy(() => import("./pages/Index"));
const GetStarted = React.lazy(() => import("./pages/GetStarted"));
const MCQs = React.lazy(() => import("./pages/MCQs"));
const QnA = React.lazy(() => import("./pages/QnA"));
const Syllabus = React.lazy(() => import("./pages/Syllabus"));
const Subscription = React.lazy(() => import("./pages/Subscription"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Support = React.lazy(() => import("./pages/Support"));
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
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

function RequireProfileCompleted({ children }: { children: React.ReactNode }) {
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
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <Index />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/get-started"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <GetStarted />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/mcqs"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <MCQs />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/qna"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <QnA />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/syllabus"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <Syllabus />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/subscription"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <Subscription />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <PageWrapper>
                <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                  <Profile />
                </Suspense>
              </PageWrapper>
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <Onboarding />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
            </RequireAuth>
          }
        />
        <Route
          path="/support"
          element={
            <RequireAuth>
              <RequireProfileCompleted>
                <PageWrapper>
                  <Suspense fallback={<div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Loading...</div>}>
                    <Support />
                  </Suspense>
                </PageWrapper>
              </RequireProfileCompleted>
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
