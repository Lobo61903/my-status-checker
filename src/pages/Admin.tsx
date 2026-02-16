import { useState, useEffect } from "react";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

const Admin = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string; display_name: string } | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("admin_token");
    if (savedToken) {
      setToken(savedToken);
      try {
        const bodyPart = savedToken.split('.')[1];
        let b64 = bodyPart.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const payload = JSON.parse(atob(b64));
        if (payload.exp > Date.now()) {
          setUser({ id: payload.sub, username: payload.username, display_name: payload.name });
        } else {
          sessionStorage.removeItem("admin_token");
          setToken(null);
        }
      } catch {
        sessionStorage.removeItem("admin_token");
      }
    }
  }, []);

  const handleLogin = (t: string, u: { id: string; username: string; display_name: string }) => {
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token} user={user} onLogout={handleLogout} />;
};

export default Admin;
