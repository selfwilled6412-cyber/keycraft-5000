import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";

const navItems = [
  { to: "/", label: "拠点", icon: "♜" },
  { to: "/map", label: "建設", icon: "⚒" },
  { to: "/missions", label: "MISSION", icon: "✦" },
  { to: "/progress", label: "実績", icon: "★" },
  { to: "/deliverables", label: "成果物", icon: "⬢" },
  { to: "/settings", label: "設定", icon: "⚙" },
];

export function Layout() {
  const { session } = usePlayer();
  const { pathname } = useLocation();
  const immersive = pathname === "/" || pathname === "/play";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (immersive) {
    return <div className={`app-shell immersive-shell ${pathname === "/play" ? "play-shell" : "hub-shell"}`}><Outlet /></div>;
  }

  return (
    <div className="app-shell hc-app-shell">
      <header className="hc-site-header">
        <NavLink className="hc-mini-brand" to="/"><span>KC</span><div><b>KEY CRAFT 5000</b><small>{session?.preferences.nickname ?? "GUEST"}</small></div></NavLink>
        <nav aria-label="メインメニュー">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : undefined}>
              <span aria-hidden="true">{item.icon}</span><b>{item.label}</b>
            </NavLink>
          ))}
        </nav>
        <div className="hc-header-status"><span>KEY</span><strong>{session?.keyId ?? "------"}</strong></div>
      </header>
      <main className="hc-content-main"><Outlet /></main>
      <nav className="hc-mobile-dock" aria-label="モバイルメニュー">
        {navItems.slice(0, 5).map((item) => <NavLink key={item.to} to={item.to}><span>{item.icon}</span><b>{item.label}</b></NavLink>)}
      </nav>
    </div>
  );
}
