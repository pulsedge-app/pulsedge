export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-teal mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary">Back to home</Link>
    </div>
  );
}
