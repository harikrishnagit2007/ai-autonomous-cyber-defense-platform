import { ShieldAlert, ShieldCheck } from "lucide-react";

interface AIGaugeProps {
  score: number;
}

export default function AIGauge({ score }: AIGaugeProps) {
  // Compute color scheme based on current security score
  const isHealthy = score >= 85;
  const isWarning = score >= 60 && score < 85;

  const strokeColor = isHealthy 
    ? "stroke-cyan-400" 
    : isWarning 
      ? "stroke-amber-400" 
      : "stroke-rose-500";

  const glowClass = isHealthy 
    ? "shadow-cyan-500/30 text-cyan-400" 
    : isWarning 
      ? "shadow-amber-500/30 text-amber-400" 
      : "shadow-rose-500/30 text-rose-500";

  // Calculate SVG arc values
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex h-40 w-40 items-center justify-center">
        {/* Dynamic Arc circle indicator */}
        <svg className="absolute top-0 left-0 h-full w-full -rotate-90">
          {/* Background track arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-gray-800"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Active indicator arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center score readout values */}
        <div className="flex flex-col items-center justify-center z-10 text-center">
          <span id="ai-gauge-score-value" className={`font-display text-4xl font-extrabold tracking-tight ${glowClass} text-glow`}>
            {score}
          </span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">
            Global Score
          </span>
        </div>
      </div>

      <div className={`mt-2 flex items-center gap-2 rounded-full px-3 py-1 bg-gray-900/40 border text-xs font-mono font-semibold ${
        isHealthy 
          ? "border-cyan-500/20 text-cyan-400" 
          : isWarning 
            ? "border-amber-500/20 text-amber-400" 
            : "border-rose-500/20 text-rose-500"
      }`}>
        {isHealthy ? (
          <>
            <ShieldCheck className="h-4 w-4" />
            <span>SECURE SENTINEL OK</span>
          </>
        ) : (
          <>
            <ShieldAlert className="h-4 w-4 animate-bounce" />
            <span>MITIGATION REQUIRED</span>
          </>
        )}
      </div>
    </div>
  );
}
