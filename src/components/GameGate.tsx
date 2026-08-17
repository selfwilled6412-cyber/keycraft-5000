import { Link } from "react-router-dom";

export function GameGate({ title = "KEY IDを発行して始めましょう" }: { title?: string }) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon">⌨</div>
      <p className="eyebrow">START CRAFTING</p>
      <h1>{title}</h1>
      <p>ホームの「すぐ始める」から、登録なしでKEY IDを発行できます。</p>
      <Link className="button primary" to="/">ホームへ</Link>
    </section>
  );
}
