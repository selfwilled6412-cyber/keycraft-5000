import { useEffect, useMemo, useState } from "react";
import { deliverableFileUrl, fetchDeliverables, uploadDeliverable, type DeliverableKind, type DeliverableRecord } from "../api/client";
import { catalog } from "../content/catalog";
import { premiumHeroes } from "../content/premiumAssets";
import { createAutomaticMissionArtifacts } from "../deliverables/autoArtifacts";
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
  const [repairing, setRepairing] = useState(false);
  const [repairProgress, setRepairProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const query = new URLSearchParams(window.location.search);
    const visualReview = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") && query.get("visualReview") === "1";
    if (visualReview) return;
    let active = true;

    const loadAndRepair = async () => {
      setLoading(true);
      setError(null);
      try {
        const initial = await fetchDeliverables(session.keyId);
        if (!active) return;
        setItems(initial.deliverables);
        setLoading(false);

        const completedMissions = catalog.missions
          .filter((mission) => session.completedMissionIds.includes(mission.id))
          .sort((a, b) => a.number - b.number);
        if (completedMissions.length === 0) return;

        const existingKeys = new Set(initial.deliverables.map((item) => item.eventKey));
        const currentSettlement = initial.deliverables.find((item) => item.eventKey === "current-settlement");
        const currentSavedMissionCount = Number(currentSettlement?.metadata.completedMissions ?? -1);
        const plans: Array<{ missionIndex: number; expectedKeys: string[] }> = [];

        completedMissions.forEach((mission, index) => {
          const beforeIds = completedMissions.slice(0, index).map((item) => item.id);
          const afterIds = completedMissions.slice(0, index + 1).map((item) => item.id);
          const expectedKeys: string[] = [];
          const missionKey = `mission:${mission.id}`;
          if (!existingKeys.has(missionKey)) expectedKeys.push(missionKey);

          if (index === completedMissions.length - 1 && currentSavedMissionCount !== completedMissions.length) {
            expectedKeys.push("current-settlement");
          }

          const districtMissions = catalog.missions.filter((item) => item.districtId === mission.districtId);
          const completeAfter = districtMissions.every((item) => afterIds.includes(item.id));
          const completeBefore = districtMissions.every((item) => beforeIds.includes(item.id));
          if (completeAfter && !completeBefore) {
            const districtKey = `district:${mission.districtId}`;
            if (!existingKeys.has(districtKey)) expectedKeys.push(districtKey);
          }

          premiumHeroes
            .filter((hero) => hero.unlockMission === index + 1)
            .forEach((hero) => {
              const heroKey = `hero:${hero.id}`;
              if (!existingKeys.has(heroKey)) expectedKeys.push(heroKey);
            });

          if (expectedKeys.length > 0) plans.push({ missionIndex: index, expectedKeys });
        });

        const total = plans.reduce((sum, plan) => sum + plan.expectedKeys.length, 0);
        if (total === 0) return;
        setRepairing(true);
        setRepairProgress({ done: 0, total });
        let done = 0;

        for (const plan of plans) {
          if (!active) return;
          const mission = completedMissions[plan.missionIndex];
          if (!mission) continue;
          const completedBefore = completedMissions.slice(0, plan.missionIndex).map((item) => item.id);
          const afterMissionIds = new Set(completedMissions.slice(0, plan.missionIndex + 1).map((item) => item.id));
          const completedPhrasesAfter = session.progress.filter((item) => afterMissionIds.has(item.missionId)).length;
          const generated = await createAutomaticMissionArtifacts({
            keyId: session.keyId,
            nickname: session.preferences.nickname ?? session.keyId,
            mission,
            completedMissionIdsBefore: completedBefore,
            completedPhrasesAfter,
          });
          const wanted = new Set(plan.expectedKeys);
          for (const artifact of generated.filter((item) => wanted.has(item.eventKey))) {
            if (!active) return;
            await uploadDeliverable({ keyId: session.keyId, ...artifact });
            done += 1;
            setRepairProgress({ done, total });
          }
        }

        const refreshed = await fetchDeliverables(session.keyId);
        if (active) setItems(refreshed.deliverables);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "自動納品庫を読み込めませんでした");
      } finally {
        if (active) {
          setLoading(false);
          setRepairing(false);
        }
      }
    };

    void loadAndRepair();
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
          <p>MISSIONを進めるだけで、ここへPNGが自動保存されます。過去分や保存漏れも自動で復元します。</p>
        </div>
        <div className="stored-deliverables-count"><strong>{items.length}</strong><span>PNG SAVED</span></div>
      </header>

      <div className="stored-deliverables-summary">
        {(Object.keys(kindLabels) as DeliverableKind[]).map((kind) => <span key={kind}><b>{groupedCount[kind] ?? 0}</b>{kindLabels[kind]}</span>)}
      </div>

      {loading && <div className="stored-deliverables-state">クラウド成果物を読み込んでいます…</div>}
      {repairing && <div className="stored-deliverables-state repairing">過去の成果物・保存漏れを自動復元しています… <b>{repairProgress.done} / {repairProgress.total}</b><small>この処理は初回または不足がある時だけ行います。</small></div>}
      {error && <div className="stored-deliverables-state error">{error}<small>進捗データには影響ありません。次回このページを開いた時に再び自動補完します。</small></div>}
      {!loading && !repairing && !error && items.length === 0 && <div className="stored-deliverables-state">次のMISSIONを完成すると、最初の成果物PNGがここへ自動保存されます。</div>}

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
