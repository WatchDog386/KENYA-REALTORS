import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "./index.css";
import "./styles/adminlte-bridge.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter future={{ v7_relativeSplatPath: true }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
