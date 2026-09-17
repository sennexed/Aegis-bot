import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  UploadCloud,
  CheckCircle2,
  RotateCw,
  Zap,
} from "lucide-react";

interface QuickDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployComplete?: () => void;
}

export const QuickDeployModal: React.FC<QuickDeployModalProps> = ({
  isOpen,
  onClose,
  onDeployComplete,
}) => {
  const [deployStep, setDeployStep] = useState<number>(0); // 0: ready, 1: archiving, 2: sftp, 3: container boot, 4: verified

  if (!isOpen) return null;

  const handleRunDeployment = () => {
    setDeployStep(1);
    setTimeout(() => {
      setDeployStep(2);
      setTimeout(() => {
        setDeployStep(3);
        setTimeout(() => {
          setDeployStep(4);
          if (onDeployComplete) onDeployComplete();
        }, 1200);
      }, 1400);
    }, 1200);
  };

  const steps = [
    { num: 1, title: "Building Production Bundle", desc: "Packaging pre-compiled JavaScript dist/ and TypeScript sources" },
    { num: 2, title: "SFTP Sync to Wispbyte", desc: "Connecting to wisp-sg-node01.wispbyte.net via port 2022" },
    { num: 3, title: "Pterodactyl Egg Initialization", desc: "Booting ghcr.io/pterodactyl/yolks:nodejs_20 with 512MB RAM" },
    { num: 4, title: "Discord Gateway Online", desc: "Shard #0 connected with Privileged Intents active" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  Deploy to Wispbyte
                </h3>
                <p className="text-xs text-zinc-500">
                  Pterodactyl Node.js Hosting deployment simulator.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Steps Progress */}
            <div className="space-y-3">
              {steps.map((step) => {
                const isFinished = deployStep > step.num || deployStep === 4;
                const isCurrent = deployStep === step.num;

                return (
                  <div
                    key={step.num}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                      isFinished
                        ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                        : isCurrent
                        ? "border-indigo-300 bg-indigo-50/30 text-indigo-950 shadow-sm ring-2 ring-indigo-50"
                        : "border-zinc-200 bg-zinc-50/50 text-zinc-500 opacity-60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isFinished
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {isFinished ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isCurrent ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        step.num
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900">{step.title}</h4>
                      <p className="text-[11px] text-zinc-500 truncate">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <button
                onClick={handleRunDeployment}
                disabled={deployStep > 0 && deployStep < 4}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
              >
                {deployStep > 0 && deployStep < 4 ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Deploying to Wispbyte Container...</span>
                  </>
                ) : deployStep === 4 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Re-Run Deployment Simulation</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Simulate 24/7 Deploy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
