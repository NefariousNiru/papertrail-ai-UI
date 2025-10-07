// src/app/routes.tsx
import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "../pages/Home";
import { Dashboard } from "../pages/Dashboard";
import { useApiKey } from "../features/api-key/useApiKey";
import type { JSX } from "react";

/**
 * Flow:
 * - HomeOrRedirect: if API key exists in localStorage (via store), jump to /app.
 * - RequireApiKey: protects /app so users without a key go back to Home.
 */
function HomeOrRedirect() {
  const { claudeApiKey } = useApiKey();
  if (claudeApiKey) return <Navigate to="/app" replace />;
  return <Home />;
}

function RequireApiKey({ children }: { children: JSX.Element }) {
  const { claudeApiKey } = useApiKey();
  if (!claudeApiKey) return <Navigate to="/" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeOrRedirect />} />
      <Route
        path="/app"
        element={
          <RequireApiKey>
            <Dashboard />
          </RequireApiKey>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
