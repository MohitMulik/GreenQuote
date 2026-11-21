import Link from "next/link";
import { BarChart3, ShieldCheck, ArrowLeft } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-800 bg-slate-900 text-white sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 text-slate-300 hover:text-white transition">
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="font-bold text-sm tracking-tight text-white">GreenQuote Executive Portal</span>
            </Link>
            <span className="text-[11px] bg-purple-900 text-purple-200 border border-purple-700 font-semibold px-2 py-0.5 rounded-full">
              Operations & Risk
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs font-semibold text-slate-300">
            <Link
              href="/admin/analytics"
              className="flex items-center space-x-1.5 hover:text-white transition py-1"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Platform Analytics (S14)</span>
            </Link>
            <Link
              href="/admin/review-queue"
              className="flex items-center space-x-1.5 hover:text-white transition py-1"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Operations & Review Queue</span>
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
