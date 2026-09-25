export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading products" className="animate-pulse">
      <div className="mx-auto max-w-[1750px] px-5 md:px-10 xl:px-12 pt-6 md:pt-10 pb-16 xl:pb-20">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-6">
          <div className="h-8 w-48 rounded bg-neutral-03 md:mr-auto" />
          <div className="h-11 w-full md:w-72 rounded-full bg-neutral-02" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-[5/6] rounded-sm bg-neutral-02" />
              <div className="h-3 w-3/4 rounded bg-neutral-02" />
              <div className="h-3 w-1/3 rounded bg-neutral-02" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
