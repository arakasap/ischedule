import {
  type ExamGroup,
  DOW,
  MON,
  colorFor,
  dateParts,
  hourRange,
  layoutLanes,
  sectionsOf,
  typesOf,
  visibleDates,
} from "@/lib/exam-utils";

const LABEL_W = 88; // px ของคอลัมน์วันที่
const HOUR_W = 72; // px ต่อหนึ่งชั่วโมง
const LANE_H = 60;
const BLOCK_H = 56;

const pad2 = (n: number) => String(n).padStart(2, "0");

interface Props {
  groups: ExamGroup[];
  byDate: Map<string, ExamGroup[]>;
  banner: string[];
}

/** ตารางสอบแบบแกนเวลา: แถวคือวันสอบ คอลัมน์คือชั่วโมง */
export function TimetableGrid({ groups, byDate, banner }: Props) {
  const { t0, t1 } = hourRange(groups);
  const hours = t1 - t0;
  const span = hours * 60;
  const dates = visibleDates(byDate);
  const colPct = 100 / hours;

  const gridLines = `repeating-linear-gradient(to right, transparent 0, transparent calc(${colPct}% - 1px), var(--line) calc(${colPct}% - 1px), var(--line) ${colPct}%)`;

  return (
    <section aria-label="ตารางสอบตามเวลา" className="surface-lift overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-accent/20 bg-accent-soft px-4 py-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-accent">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          ตารางสอบตามเวลา
        </div>
        <div className="text-xs text-ink-2"><span className="md:hidden">การ์ดสรุปอยู่ด้านบน · </span>เลื่อนซ้าย–ขวาเพื่อดูตารางเต็ม</div>
      </div>
      <div className="bg-accent px-4 py-3.5 text-center font-semibold leading-relaxed text-accent-ink">
        {banner.map((line, i) => (
          <div key={i} className={i === 0 ? "" : "text-sm font-normal"}>
            {line}
          </div>
        ))}
      </div>
      <div className="divide-y divide-line md:hidden">
        {[...byDate.entries()].map(([date, list]) => {
          const p = dateParts(date);
          return (
            <div key={date} className="p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="text-accent">{DOW[p.dow]}</span>
                <span>{p.d} {MON[p.m - 1]}</span>
                <span className="ml-auto text-xs font-normal text-ink-2">{list.length} วิชา</span>
              </div>
              <div className="space-y-2">
                {list.map((group) => (
                  <article key={group.key} className="rounded-xl border border-line bg-bg p-3" style={{ borderLeft: `4px solid ${colorFor(group.code)}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-medium text-accent">{group.code}</div>
                        <h3 className="mt-0.5 break-words text-sm font-semibold leading-5">{group.name}</h3>
                      </div>
                      <time className="shrink-0 rounded-md bg-surface px-2 py-1 font-mono text-xs font-medium tabular-nums">{group.info.label}</time>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
                      <span>กลุ่ม {sectionsOf(group)}</span>
                      <span>ประเภท {typesOf(group)}</span>
                      <span>{group.credit}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line md:border-t-0">
        <div className="border-b border-line bg-bg px-4 py-2 text-xs font-medium text-ink-2 md:hidden">
          ตารางเต็มตามช่วงเวลา
        </div>
      </div>
      <div className="block overflow-x-auto overscroll-x-contain touch-pan-x">
        <div style={{ minWidth: LABEL_W + hours * HOUR_W }}>
          <div className="grid border-b border-line bg-bg" style={{ gridTemplateColumns: `${LABEL_W}px minmax(0,1fr)` }}>
            <div className="sticky left-0 z-20 border-r border-line bg-bg px-2 py-2 text-[0.65rem] font-medium text-ink-2">วันสอบ</div>
            <div className="grid font-mono text-[0.66rem] text-ink-2" style={{ gridTemplateColumns: `repeat(${hours}, 1fr)` }}>
              {Array.from({ length: hours }, (_, i) => (
                <span key={i} className="whitespace-nowrap border-l border-line py-2 text-center font-medium">
                  {pad2(t0 + i)}:00-{pad2(t0 + i + 1)}:00
                </span>
              ))}
            </div>
          </div>

          {dates.map((date, rowIndex) => {
            const p = dateParts(date);
            const { items, laneCount } = layoutLanes(byDate.get(date) ?? []);
            return (
              <div
                key={date}
                className={"grid border-b border-line last:border-b-0 " + (rowIndex % 2 ? "bg-bg/70" : "bg-surface")}
                style={{ gridTemplateColumns: `${LABEL_W}px minmax(0,1fr)` }}
              >
                <div className="sticky left-0 z-10 flex flex-col justify-center border-r border-line bg-inherit px-2.5 py-2 text-[0.82rem] leading-snug">
                  <b className={p.dow === 0 || p.dow === 6 ? "text-ink-2" : ""}>{DOW[p.dow]}</b>
                  <span className="text-xs text-ink-2">
                    {p.d} {MON[p.m - 1]}
                  </span>
                </div>
                <div className="relative" style={{ height: laneCount * LANE_H + 8, backgroundImage: gridLines }}>
                  {items.map(({ group, lane }) => {
                    const left = ((group.info.startMin - t0 * 60) / span) * 100;
                    const width = ((group.info.endMin - group.info.startMin) / span) * 100;
                    const secs = sectionsOf(group);
                    const tip = `${group.code} ${group.name} ${group.credit} | กลุ่ม ${secs} | ${group.info.label}`;
                    return (
                      <div
                        key={group.key}
                        title={tip}
                        className="absolute flex flex-col justify-between overflow-hidden rounded-lg border border-white/20 px-1.5 py-[4px] text-[0.7rem] leading-tight text-white shadow-md transition-transform hover:z-20 hover:scale-[1.02]"
                        style={{
                          left: `${left}%`,
                          width: `calc(${width}% - 3px)`,
                          top: 4 + lane * LANE_H,
                          height: BLOCK_H,
                          background: colorFor(group.code),
                        }}
                      >
                        <span className="font-mono text-[0.62rem] opacity-90">{group.code}</span>
                        <span className="line-clamp-2 text-center text-[0.66rem] font-semibold uppercase">{group.name}</span>
                        <span className="flex justify-between gap-1.5 whitespace-nowrap font-mono text-[0.6rem]">
                          <span>
                            กลุ่ม {secs} ({typesOf(group)})
                          </span>
                          <span>{group.info.label}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
