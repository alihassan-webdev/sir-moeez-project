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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import GetStarted from "./pages/GetStarted";
import MCQs from "./pages/MCQs";
import QnA from "./pages/QnA";

const queryClient = new QueryClient();

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] bg-background">{children}</div>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
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
          path="/app"
          element={
            <PageWrapper>
              <Index />
            </PageWrapper>
          }
        />
        <Route
          path="/get-started"
          element={
            <PageWrapper>
              <GetStarted />
            </PageWrapper>
          }
        />
        <Route
          path="/mcqs"
          element={
            <PageWrapper>
              <MCQs />
            </PageWrapper>
          }
        />
        <Route
          path="/qna"
          element={
            <PageWrapper>
              <QnA />
            </PageWrapper>
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
