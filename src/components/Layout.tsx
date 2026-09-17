import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { Logo } from "./Logo";
import { StoredDeliverablesShelf } from "./StoredDeliverablesShelf";

const navItems = [
  { to: "/map", label: "拠点", icon: "♜" },
  { to: "/heroes", label: "英雄", icon: "♟" },
  { to: "/missions", label: "MISSION", icon: "✦" },
  { to: "/progress", label: "実績", icon: "★" },
  { to: "/deliverables", label: "成果物", icon: "◆" },
  { to: "/settings", label: "設定", icon: "⚙" },
];

export function Layout() {
  const { session, loading } = usePlayer();
  const { pathname } = useLocation();
  const isPlay = pathname === "/play";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (isPlay) {
    return <div className="app-shell play-shell"><Outlet /></div>;
  }

  return (
    <div className="app-shell premium-shell">
      <header className="site-header premium-site-header">
        <Logo />
        <nav aria-label="メインメニュー">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : undefined}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="key-chip" aria-live="polite">
          <span>KEY</span>
          <strong>{loading ? "------" : session?.keyId ?? "GUEST"}</strong>
        </div>
      </header>
      <main>
        <Outlet />
        {pathname === "/deliverables" && <StoredDeliverablesShelf />}
      </main>
      <footer className="site-footer premium-site-footer">
        <Logo />
        <p>打つほど、世界ができていく。</p>
        <small>KEY CRAFT 5000 / Premium World Build</small>
      </footer>
    </div>
  );
}
