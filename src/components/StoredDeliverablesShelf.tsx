import { useEffect, useMemo, useState } from "react";
import { deliverableFileUrl, fetchDeliverables, type DeliverableKind, type DeliverableRecord } from "../api/client";
import { usePlayer } from "../context/PlayerContext";

const kindLabels: Record<DeliverableKind, string> = {
  current_settlement: "最新の街",
  mission_clear: "MISSION CLEAR",
  district_complete: "DISTRICT COMPLETE",
  hero_unlock: "HERO UNLOCK",
};

const formatBytes = (value: number) => value >= 1024 * 1024
  ? `${(value / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(value / 1024))} KB`;

export function StoredDeliverablesShelf() {
  const { session } = usePlayer();
  const [items, setItems] = useState<DeliverableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const query = new URLSearchParams(window.location.search);
    const visualReview = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") && query.get("visualReview") === "1";
    if (visualReview) return;
    let active = true;
    setLoading(true);
    setError(null);
    void fetchDeliverables(session.keyId)
      .then(({ deliverables }) => { if (active) setItems(deliverables); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "自動納品庫を読み込めませんでした"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.keyId]);

  const groupedCount = useMemo(() => {
    const result: Partial<Record<DeliverableKind, number>> = {};
    items.forEach((item) => { result[item.kind] = (result[item.kind] ?? 0) + 1; });
    return result;
  }, [items]);

  if (!session) return null;

  return (
    <section className="stored-deliverables-shell" aria-labelledby="stored-deliverables-title">
      <header className="stored-deliverables-header">
        <div>
          <span>AUTO DELIVERY VAULT</span>
          <h2 id="stored-deliverables-title">自動納品庫</h2>
          <p>MISSIONを進めるだけで、ここへPNGが自動保存されます。手動生成は不要です。</p>
        </div>
        <div className="stored-deliverables-count"><strong>{items.length}</strong><span>PNG SAVED</span></div>
      </header>

      <div className="stored-deliverables-summary">
        {(Object.keys(kindLabels) as DeliverableKind[]).map((kind) => <span key={kind}><b>{groupedCount[kind] ?? 0}</b>{kindLabels[kind]}</span>)}
      </div>

      {loading && <div className="stored-deliverables-state">クラウド成果物を読み込んでいます…</div>}
      {error && <div className="stored-deliverables-state error">{error}<small>進捗データには影響ありません。</small></div>}
      {!loading && !error && items.length === 0 && <div className="stored-deliverables-state">次のMISSIONを完成すると、最初の成果物PNGがここへ自動保存されます。</div>}

      {items.length > 0 && (
        <div className="stored-deliverables-grid">
          {items.map((item) => (
            <article key={item.id} className={`stored-deliverable-card kind-${item.kind}`}>
              <div className="stored-deliverable-image">
                <img src={deliverableFileUrl(session.keyId, item.id)} alt={item.filename} loading="lazy" />
                <span>{kindLabels[item.kind]}</span>
              </div>
              <div className="stored-deliverable-copy">
                <strong>{item.filename}</strong>
                <small>{new Date(item.createdAt).toLocaleString("ja-JP")} · {formatBytes(item.byteSize)}</small>
                <a href={deliverableFileUrl(session.keyId, item.id, true)} download={item.filename}>PNGをダウンロード</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
