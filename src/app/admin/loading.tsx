/** Panel gezinmelerinde anında geri bildirim (RSC akışı tamamlanana kadar). */
export default function AdminLoading() {
  return (
    <div aria-busy className="space-y-6">
      <div className="h-12 w-64 animate-pulse rounded-md bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-card" />
    </div>
  );
}
