export default function Loading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="กำลังโหลดหน้าเว็บ">
      <nav className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="skeleton h-8 w-36 rounded-xl" />
          <div className="hidden gap-2 sm:flex">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 pb-12">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="skeleton h-12 w-12 rounded-2xl" />
          <div className="skeleton h-4 w-52 rounded" />
          <div className="skeleton h-9 w-72 max-w-full rounded-lg" />
          <div className="skeleton h-10 w-full max-w-2xl rounded-lg" />
        </header>
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="skeleton h-20 rounded-none" />
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="skeleton h-11 rounded-lg" />)}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="skeleton h-14 rounded-none" />
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-14 rounded-lg" />)}
          </div>
        </section>
        <p className="text-center text-sm text-ink-2">กำลังเตรียมตารางสอบให้คุณ...</p>
      </main>
    </div>
  );
}
