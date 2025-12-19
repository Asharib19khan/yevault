import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">YE VAULT SYSTEM</h1>
      <Link 
        href="/ai" 
        className="px-6 py-3 border border-white hover:bg-white hover:text-black transition-all"
      >
        [ ENTER NEURAL LINK ]
      </Link>
    </main>
  );
}
