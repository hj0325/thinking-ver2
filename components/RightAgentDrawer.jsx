"use client";

import { Check, Lightbulb, MessageCircle, X } from "lucide-react";

function ContextMiniCard({ item }) {
  return (
    <div className="relative min-w-0 rounded-2xl border border-white/70 bg-white/78 px-2.5 py-2 shadow-sm">
      <span className="absolute right-1 top-1 rounded-full p-0.5 text-slate-400" aria-hidden>
        <X className="h-3 w-3" />
      </span>
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
  const isTip = mode === "tip";
  const isChat = mode === "chat";

  return (
    <div className="pointer-events-none absolute bottom-24 right-3 top-20 z-[45] flex items-center">
      <div className="pointer-events-auto relative flex h-full items-center">
        <div
          className={`relative z-20 flex flex-col items-center gap-2 border border-white/70 bg-white/58 py-3 shadow-xl backdrop-blur-md transition-all duration-300 ${
            isOpen ? "h-[172px] w-[58px] rounded-[28px]" : "h-[150px] w-[52px] rounded-[26px]"
          }`}
        >
          <span className="h-4 w-4 rounded-full border border-white/80 bg-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,0.55)]" />
          <button
            type="button"
            className={`inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-1.5 text-xs font-semibold transition ${
              isTip && isOpen ? "bg-white text-slate-900 shadow-sm" : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
            onClick={() => onToggleMode("tip")}
          >
            Tip
          </button>
          <button
            type="button"
            className={`inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-1.5 text-xs font-semibold transition ${
              isChat && isOpen ? "bg-white text-slate-900 shadow-sm" : "bg-white/70 text-slate-600 hover:bg-white"
            }`}
            onClick={() => onToggleMode("chat")}
          >
            Chat
          </button>
        </div>

        <div
          className={`relative overflow-hidden rounded-[30px] border border-white/65 bg-[#d7eee3]/76 shadow-2xl backdrop-blur-md transition-[width,opacity,margin,padding] duration-300 ${
            isOpen ? "ml-2 w-[392px] p-3 opacity-100" : "ml-0 w-0 p-0 opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          {isOpen && (
            <div className="flex h-full flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {contextItems.length > 0 ? (
                  contextItems.map((item) => <ContextMiniCard key={item.id} item={item} />)
                ) : (
                  <div className="col-span-2 rounded-2xl border border-dashed border-white/80 bg-white/56 px-3 py-2 text-[11px] text-slate-500">
                    Context shelf placeholder. Drag-and-attach is planned for Phase 3.
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-white/70 bg-white/38 p-3">
                <div className="mb-3 flex items-center justify-between border-b border-white/65 pb-2">
                  <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
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

                <div className="min-h-0 flex-1 rounded-2xl border border-white/60 bg-white/30 px-3 py-2 text-sm text-slate-600">
                  {isTip ? (
                    <div className="flex h-full flex-col gap-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold">Tip mode drawer shell is active.</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500">
                        Phase 1 provides the drawer frame and mode toggle only. Tip content generation is reserved for
                        later implementation.
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col gap-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <MessageCircle className="h-4 w-4 text-teal-600" />
                        <span className="font-semibold">Chat mode drawer shell is active.</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-500">
                        Existing suggestion chat remains available via the current suggestion card flow until Phase 2
                        migration is completed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
