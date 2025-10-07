// src/App.tsx
import { AppRoutes } from "./app/routes";

/**
 * Flow comment:
 * App is a thin wrapper around top-level routes.
 * - "/" renders Home (marketing + Get Started)
 * - "/app" renders Dashboard (upload + stream claims)
 */
export default function App() {
  return <AppRoutes />;
}
