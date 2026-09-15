import React, { useState } from "react";
import {
  Zap,
  TrendingDown,
  Coins,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  ArrowDown,
  Sparkles,
  Calculator,
} from "lucide-react";

export const TokenEfficiencyCalculator: React.FC = () => {
  const [dailyMessages, setDailyMessages] = useState<number>(25000);
  const [botStaffPercent, setBotStaffPercent] = useState<number>(15); // Tier 0
  const [slangFilterPercent, setSlangFilterPercent] = useState<number>(65); // Tier 1
  const [cacheHitPercent, setCacheHitPercent] = useState<number>(10); // Tier 2 & 3

  // Computations
  const totalTriageFilteredPercent = botStaffPercent + slangFilterPercent + cacheHitPercent;
  const geminiCalledPercent = Math.max(5, 100 - totalTriageFilteredPercent);

  const naiveTokensPerMsg = 450; // System instruction + user content + schema output
  const naiveTotalTokens = dailyMessages * naiveTokensPerMsg;

  const actualGeminiMsgs = Math.round(dailyMessages * (geminiCalledPercent / 100));
  const actualTokensUsed = actualGeminiMsgs * naiveTokensPerMsg;

  const tokensSaved = naiveTotalTokens - actualTokensUsed;
  const savingsPercent = Math.round((tokensSaved / naiveTotalTokens) * 100);

  // Gemini 3.8 Flash pricing (~$0.10 per 1M input tokens, ~$0.40 per 1M output tokens, avg ~$0.15 / 1M)
  const costPerMillion = 0.15;
  const naiveMonthlyCost = (naiveTotalTokens * 30 * costPerMillion) / 1000000;
  const optimizedMonthlyCost = (actualTokensUsed * 30 * costPerMillion) / 1000000;
  const monthlySavings = naiveMonthlyCost - optimizedMonthlyCost;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Token Efficiency Engine & Cost Optimizer
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Sending every casual &quot;gg&quot; or &quot;lol&quot; to Gemini wastes tokens and adds API latency. AegisMod employs an active 4-tier filtering pipeline that resolves ~85–90% of chat traffic locally in 0 milliseconds with 0 tokens consumed.
        </p>
      </div>

      {/* Interactive Funnel Architecture */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          The 4-Tier Triage Funnel
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Tier 0</span>
                <span className="text-xs font-bold text-emerald-600">0 Tokens</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 mt-1.5">Gateway Guards</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Disregards bot messages, system alerts, empty content, and verified server staff / owner roles.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200">
              ~{botStaffPercent}% of volume
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Tier 1</span>
                <span className="text-xs font-bold text-emerald-600">0 Tokens</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 mt-1.5">Slang & Fast Pass</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Whitelists 50+ benign teen gaming slang terms (&quot;gg&quot;, &quot;lol&quot;, &quot;fr&quot;, &quot;bet&quot;, &quot;clutch&quot;, &quot;w&quot;).
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200">
              ~{slangFilterPercent}% of volume
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Tier 2 & 3</span>
                <span className="text-xs font-bold text-emerald-600">0 Tokens</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-900 mt-1.5">Regex & Cache Hit</h4>
              <p className="text-xs text-zinc-600 mt-1">
                Catches explicit &quot;kys&quot; regex patterns locally, and matches duplicates against a 10-min LRU cache.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-zinc-500 bg-white p-2 rounded border border-zinc-200">
              ~{cacheHitPercent}% of volume
            </div>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-indigo-700">Tier 4</span>
                <span className="text-xs font-bold text-indigo-600">~420 Tokens</span>
              </div>
              <h4 className="font-bold text-sm text-indigo-950 mt-1.5">Gemini 3.8 Flash</h4>
              <p className="text-xs text-indigo-900 mt-1">
                Only nuanced, ambiguous, or suspicious messages reach Gemini for contextual evaluation.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-mono text-indigo-700 bg-white p-2 rounded border border-indigo-200">
              ~{geminiCalledPercent}% of volume
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Savings Calculator */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-zinc-900">Interactive Server Scale & Cost Calculator</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {savingsPercent}% Cost Reduction
          </span>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 mb-1.5">
              <span>Daily Community Messages</span>
              <span className="font-mono text-indigo-600 text-sm font-bold">
                {dailyMessages.toLocaleString()} msgs / day
              </span>
            </div>
            <input
              type="range"
              min={2000}
              max={150000}
              step={1000}
              value={dailyMessages}
              onChange={(e) => setDailyMessages(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>Small Server (2,000)</span>
              <span>Medium (25,000)</span>
              <span>Large Community (75,000)</span>
              <span>Mega-Server (150,000)</span>
            </div>
          </div>
        </div>

        {/* Big Impact Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Daily Tokens */}
          <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50">
            <span className="text-[11px] uppercase font-bold text-zinc-400 block">Daily Tokens Consumed</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-900">
                {(actualTokensUsed / 1000).toFixed(1)}k
              </span>
              <span className="text-xs text-zinc-400 line-through">
                {(naiveTotalTokens / 1000).toFixed(1)}k
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              Saving {(tokensSaved / 1000).toFixed(0)}k tokens daily
            </p>
          </div>

          {/* Card 2: Monthly Cost */}
          <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50">
            <span className="text-[11px] uppercase font-bold text-zinc-400 block">Monthly Gemini API Bill</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600">
                ${optimizedMonthlyCost.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-400 line-through">
                ${naiveMonthlyCost.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Less than a cup of coffee per month!
            </p>
          </div>

          {/* Card 3: Annual Savings */}
          <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50">
            <span className="text-[11px] uppercase font-bold text-indigo-700 block">Annual Cost Savings</span>
            <div className="mt-2">
              <span className="text-2xl font-black text-indigo-900">
                ${(monthlySavings * 12).toFixed(2)} / yr
              </span>
            </div>
            <p className="text-xs text-indigo-700 font-semibold mt-1">
              Keeps Discord bot completely affordable on Wispbyte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
