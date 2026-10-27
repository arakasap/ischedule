import { type ExamGroup, DOW, dateParts, sectionsOf, thaiDate } from "@/lib/exam-utils";

interface Props {
  byDate: Map<string, ExamGroup[]>;
}

/** มุมมองรายการ: จัดกลุ่มตามวัน กดแถวเพื่อดูแต่ละกลุ่มเรียน */
export function ExamList({ byDate }: Props) {
  return (
    <div className="flex flex-col gap-4" aria-label="ตารางสอบแบบรายการ">
      {[...byDate.entries()].map(([date, list]) => (
        <div key={date} className="surface-lift overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-baseline gap-2.5 border-b border-line bg-accent-soft px-4 py-3 font-semibold">
            <span className="text-accent">{DOW[dateParts(date).dow]}</span>
            <span>{thaiDate(date)}</span>
            <span className="ml-auto text-[0.82rem] font-normal tabular-nums text-ink-2">{list.length} วิชา</span>
          </div>
          {list.map((g) => (
            <details key={g.key} className="group border-t border-line first-of-type:border-t-0">
              <summary className="grid cursor-pointer list-none grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 px-4 py-3 hover:bg-bg group-open:bg-bg sm:grid-cols-[118px_92px_minmax(0,1fr)_auto]">
                <span className="font-mono text-sm font-medium tabular-nums">{g.info.label}</span>
                <span className="order-last col-span-2 font-mono text-sm text-ink-2 sm:order-none sm:col-span-1">{g.code}</span>
                <span className="order-last col-span-2 min-w-0 break-words sm:order-none sm:col-span-1">
                  {g.name}
                  <span className="ml-1.5 font-mono text-[0.82rem] text-ink-2">{g.credit}</span>
                </span>
                <span className="max-w-[150px] break-words text-right font-mono text-sm text-ink-2">กลุ่ม {sectionsOf(g)}</span>
              </summary>
              <div className="scrollable-table overflow-x-auto overscroll-x-contain bg-bg px-3.5 pb-3 pt-1">
                <table className="w-full min-w-[620px] border-collapse text-[0.85rem]">
                  <thead>
                    <tr className="text-left text-ink-2">
                      {["กลุ่ม", "ประเภท", "เวลาเรียน", "ห้อง", "อาจารย์", "เงื่อนไขการลง"].map((h) => (
                        <th key={h} className="whitespace-nowrap border-b border-line py-1 pr-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...g.rows]
                      .sort((a, b) => Number(a.section) - Number(b.section) || a.type.localeCompare(b.type))
                      .map((r) => (
                        <tr key={r.id} className="align-top">
                          <td className="border-b border-line py-1.5 pr-2 font-mono">{r.section}</td>
                          <td className="border-b border-line py-1.5 pr-2">{r.type}</td>
                          <td className="whitespace-nowrap border-b border-line py-1.5 pr-2 font-mono">{r.time}</td>
                          <td className="border-b border-line py-1.5 pr-2">{r.room}</td>
                          <td className="border-b border-line py-1.5 pr-2">{r.teacher}</td>
                          <td className="border-b border-line py-1.5 pr-2">{r.cond || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}
