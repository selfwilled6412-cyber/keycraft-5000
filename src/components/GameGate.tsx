import { Link } from "react-router-dom";

export function GameGate({ title = "利用者名を決めて始めましょう" }: { title?: string }) {
  return (
    <section className="empty-state">
      <div className="empty-state-icon">⌨</div>
      <p className="eyebrow">START CRAFTING</p>
      <h1>{title}</h1>
      <p>ホームの「すぐ始める」から名前・ニックネームを決めると、次回は名前だけで続きを探せます。</p>
      <Link className="button primary" to="/">ホームへ</Link>
    </section>
  );
}
