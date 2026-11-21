import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold">
            GreenQuote Operations
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-200">
            <Link href="/admin/review-queue">Review queue</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
