export function FlowDiagram() {
  const steps = [
    { label: 'Miden Private Account', desc: 'User holds tokens privately', color: 'bg-purple-500' },
    { label: 'P2ID Note', desc: 'Funds locked in note to allocator', color: 'bg-indigo-500' },
    { label: 'Epoch Allocator', desc: 'Trusted service builds intent', color: 'bg-blue-500' },
    { label: 'SIO Solver', desc: 'Fulfills intent on destination chain', color: 'bg-cyan-500' },
    { label: 'EVM Destination', desc: 'Tokens arrive at EVM wallet', color: 'bg-green-500' },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-2">Privacy-Preserving Cross-Chain Flow</h2>
      <p className="text-sm text-gray-400 mb-5">
        P2ID notes lock funds until the cross-chain intent is fulfilled. On success the allocator
        consumes the note; on failure the user can recall it.
      </p>

      <div className="flex items-start gap-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center text-center flex-1 min-w-0">
              <div className={`w-10 h-10 ${step.color} rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {i + 1}
              </div>
              <div className="mt-2 text-xs font-medium text-white leading-tight">{step.label}</div>
              <div className="mt-0.5 text-xs text-gray-500 leading-tight">{step.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex items-center pt-3 px-1 shrink-0">
                <div className="w-6 h-0.5 bg-gray-600" />
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="font-medium text-purple-400 mb-1">Miden Side (Private)</div>
          <div className="text-gray-400">
            Token balances remain private. Only the P2ID note hash is visible on-chain.
            The allocator account ID is the only public info.
          </div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <div className="font-medium text-green-400 mb-1">EVM Side (Public)</div>
          <div className="text-gray-400">
            SIO solver executes the token transfer on the destination EVM chain.
            Transaction is publicly verifiable.
          </div>
        </div>
      </div>
    </div>
  );
}
