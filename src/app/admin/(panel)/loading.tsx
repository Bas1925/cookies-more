// Every panel page is force-dynamic and awaits the catalogue and orders from
// Netlify Blobs, so the server render takes a moment — longest on a cold
// function. Without this boundary React cannot flush anything until that work
// finishes, which on a phone reads as a blank screen for seconds. Nested inside
// (panel)/layout.tsx, so AdminShell's nav paints straight away and only the
// content area waits here.
//
// Keep this component synchronous: awaiting anything (a translator reading
// cookies, say) would suspend the fallback itself and defeat the point.
export default function AdminPanelLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div aria-hidden="true" className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-9 w-52 rounded-lg bg-[#964534]/15" />
          <div className="h-4 w-72 max-w-full rounded bg-[#4a2218]/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#964534]/15"
            >
              <div className="h-4 w-24 rounded bg-[#964534]/20" />
              <div className="mt-3 h-8 w-28 rounded-lg bg-[#4a2218]/12" />
              <div className="mt-2 h-3 w-20 rounded bg-[#4a2218]/8" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-[#964534]/20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#964534]/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-[#4a2218]/12" />
                  <div className="h-3 w-40 max-w-full rounded bg-[#4a2218]/8" />
                  <div className="h-3 w-56 max-w-full rounded bg-[#4a2218]/8" />
                </div>
                <div className="h-6 w-20 shrink-0 rounded-full bg-[#e8d4bc]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
