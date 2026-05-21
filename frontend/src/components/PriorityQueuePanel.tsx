import type { QueueEntry, RoutePlaybackSnapshot } from "../types/path";

type PriorityQueuePanelProps = {
  snapshot: RoutePlaybackSnapshot;
};

function formatMetric(value?: number): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  return value.toFixed(1);
}

function sortedQueue(queue: QueueEntry[]): QueueEntry[] {
  return [...queue].sort((left, right) => left.priority - right.priority || left.node - right.node);
}

export function PriorityQueuePanel({ snapshot }: PriorityQueuePanelProps) {
  const step = snapshot.currentTraceStep ?? snapshot.completedTraceSteps.at(-1);
  const queue = sortedQueue(step?.queue ?? []);

  return (
    <section className="priority-queue-panel" aria-label="Priority queue hiện tại">
      <div className="state-panel-head compact">
        <div>
          <span>Priority queue</span>
          <h3>Frontier</h3>
        </div>
        <strong>{queue.length}</strong>
      </div>

      {queue.length > 0 ? (
        <ol className="queue-list">
          {queue.map((entry) => (
            <li key={`${entry.node}-${entry.priority}-${entry.cost}`}>
              <span>Node {entry.node}</span>
              <div>
                <strong>p={formatMetric(entry.priority)}</strong>
                <small>
                  cost={formatMetric(entry.cost)}
                  {entry.heuristic !== undefined ? ` · h=${formatMetric(entry.heuristic)}` : ""}
                </small>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="queue-empty">Queue rỗng hoặc thuật toán đã hoàn tất.</p>
      )}
    </section>
  );
}
