import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { Logo } from "./Logo";

const navItems = [
  { to: "/map", label: "CRAFT MAP", icon: "◇" },
  { to: "/missions", label: "MISSION", icon: "□" },
  { to: "/progress", label: "進み具合", icon: "▥" },
  { to: "/deliverables", label: "成果物", icon: "◆" },
  { to: "/settings", label: "設定", icon: "○" },
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
    <div className="app-shell">
      <header className="site-header">
        <Logo />
        <nav aria-label="メインメニュー">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? "active" : undefined}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="key-chip" aria-live="polite">
          <span>KEY ID</span>
          <strong>{loading ? "------" : session?.keyId ?? "未発行"}</strong>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="site-footer">
        <Logo />
        <p>打つほど、世界ができていく。</p>
        <small>無料・登録不要・外部画像なし</small>
      </footer>
    </div>
  );
}
