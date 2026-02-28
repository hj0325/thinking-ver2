"use client";

import { Check, Lightbulb, MessageCircle, X } from "lucide-react";

function ContextMiniCard({ item }) {
  return (
    <div className="relative min-w-0 rounded-2xl border border-white/70 bg-white/50 p-2.5 shadow-[0_8px_18px_rgba(0,0,0,0.08)] backdrop-blur-[10px]">
      <button
        type="button"
        className="absolute right-1 top-1 rounded-full p-0.5 text-slate-400 transition hover:bg-white/80"
        aria-label="Remove attached context card"
      >
        <X className="h-3 w-3" />
      </button>
      <div className="mb-1 flex items-center gap-1.5 pr-4">
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
          {item.category || "What"}
        </span>
        <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">
          {item.phase || "Problem"}
        </span>
      </div>
      <div className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-700">{item.title}</div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">{item.content}</div>
    </div>
  );
}

export default function RightAgentDrawer({
  isOpen,
  mode,
  suggestions,
  onToggleMode,
  onClose,
}) {
  const contextItems = suggestions.slice(0, 2);
  const hasTipSignal = suggestions.length > 0;
  const isTip = mode === "tip";
  const isChat = mode === "chat";
  const drawerFieldGradient =
    "radial-gradient(100.27% 97.75% at 97.75% 50%, #E0FFF4 0%, #AEF1DA 22.12%, #BBD8E6 80.17%, #FFFFEA 100%)";
  const drawerFieldFeather =
    "linear-gradient(90deg, rgba(166,255,211,0) 0%, rgba(166,255,211,0.72) 12%, rgba(166,255,211,0.96) 22%, rgba(166,255,211,1) 30%)";

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-[45] overflow-hidden">
      <div
        className={`relative flex h-full w-[508px] transform-gpu transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-[430px]"
        }`}
      >
        <div className="pointer-events-auto relative w-[78px]">
          <div className="absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-white/35 to-transparent" />
          <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-[10px]">
            <button
              type="button"
              className={`relative inline-flex h-[52px] w-[52px] items-center justify-center rounded-full text-[13px] font-semibold leading-none text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition ${
                isTip && isOpen ? "bg-white" : "bg-white/95 hover:bg-white"
              }`}
              onClick={() => onToggleMode("tip")}
              aria-label="Open tip drawer"
            >
              Tip
              {hasTipSignal && (
                <span
                  className="absolute right-[-3px] top-[-3px] h-3 w-3 rounded-full border border-white/80"
                  style={{ backgroundColor: "#C084FC" }}
                  aria-hidden
                />
              )}
            </button>
            <button
              type="button"
              className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-full text-[13px] font-semibold text-[#111111] shadow-[0_4px_14px_rgba(0,0,0,0.14)] transition ${
                isChat && isOpen ? "bg-white" : "bg-white/95 hover:bg-white"
              }`}
              onClick={() => onToggleMode("chat")}
              aria-label="Open chat drawer"
            >
              Chat
            </button>
          </div>
        </div>

        <div
          className={`relative h-full w-[430px] overflow-hidden transition-opacity duration-200 ${
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!isOpen}
          style={{
            background: `${drawerFieldFeather}, ${drawerFieldGradient}, #AEE7D0`,
          }}
        >
          <div className="relative z-10 flex h-full flex-col gap-3 p-4">
            <div className="grid grid-cols-2 gap-2">
              {contextItems.length > 0 ? (
                contextItems.map((item) => <ContextMiniCard key={item.id} item={item} />)
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-white/75 bg-white/42 px-3 py-2 text-[11px] text-slate-600 backdrop-blur-[8px]">
                  Context shelf placeholder. Drag-and-attach is planned for Phase 3.
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/65 bg-white/32 p-3 shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-[12px]">
              <div className="mb-3 flex items-center justify-between border-b border-white/65 pb-2">
                <div className="inline-flex items-center rounded-full bg-white/82 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                  {isTip ? "Tip" : "Chat"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/82 text-slate-500 shadow-sm hover:bg-white"
                    aria-label="Confirm drawer"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/82 text-slate-500 shadow-sm hover:bg-white"
                    aria-label="Close drawer"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 rounded-2xl border border-white/60 bg-white/25 px-3 py-2 text-sm text-slate-700 backdrop-blur-[12px]">
                {isTip ? (
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="font-semibold">Tip mode content is active.</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      The glassmorphism content panel remains visible while we refine button/field visuals.
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MessageCircle className="h-4 w-4 text-teal-600" />
                      <span className="font-semibold">Chat mode content is active.</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Existing suggestion chat fallback remains available until Phase 2 chat migration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
