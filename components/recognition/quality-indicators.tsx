export function QualityIndicators({ insideGuideFrame, steady, handDetected }: {
  insideGuideFrame: boolean;
  steady: boolean;
  handDetected: boolean;
}) {
  const indicators = [["Guide", insideGuideFrame], ["Steady", steady], ["Hand", handDetected]] as const;
  return <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
    {indicators.map(([label, active]) => <div key={label} className="flex flex-col items-center gap-1">
      <span className={active ? "text-emerald-500" : "text-slate-400"}>{active ? "✓" : "○"}</span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>)}
  </div>;
}
