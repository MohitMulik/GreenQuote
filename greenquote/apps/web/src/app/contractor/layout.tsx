import Link from "next/link";

export default function ContractorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-bold text-slate-900">
            GreenQuote
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/contractor/pipeline">Pipeline</Link>
            <Link href="/contractor/quote/new">New Quote</Link>
            <Link href="/contractor/login">Sign in</Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
