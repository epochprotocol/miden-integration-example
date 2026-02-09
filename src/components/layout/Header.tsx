export function Header() {
  return (
    <header className="border-b border-gray-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
        <h1 className="text-xl font-bold text-white">Miden x Epoch</h1>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">testnet</span>
      </div>
    </header>
  );
}
