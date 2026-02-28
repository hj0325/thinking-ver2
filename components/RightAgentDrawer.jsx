"use client";

import { useEffect, useRef } from "react";
import { Check, GitBranch, Lightbulb, Loader2, Send, X } from "lucide-react";

const CATEGORY_COLORS = {
  Who: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  What: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  When: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  Where: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  Why: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  How: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700" },
};
const DRAWER_TOP_SAFE_ZONE = 56;

function ContextMiniCard({ item, isActive, onSelect }) {
  const colors = CATEGORY_COLORS[item?.category] || CATEGORY_COLORS.What;

  return (
    <button
      type="button"
      className={`relative min-w-0 rounded-2xl border p-2.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.08)] backdrop-blur-[10px] transition ${
        isActive
          ? "border-teal-300 bg-white/72 ring-2 ring-teal-200"
          : "border-white/70 bg-white/50 hover:bg-white/60"
      }`}
      onClick={() => onSelect?.(item)}
      aria-label={`Select context card ${item?.title ?? ""}`}
    >
      <div className="mb-1 flex items-center gap-1.5 pr-2">
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
          {item.category || "What"}
        </span>
        <span className="rounded-full bg-fuchsia-100 px-1.5 py-0.5 text-[9px] font-semibold text-fuchsia-700">
          {item.phase || "Problem"}
        </span>
      </div>
      <div className={`line-clamp-2 text-[11px] font-semibold leading-tight ${isActive ? colors.text : "text-slate-700"}`}>
        {item.title}
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">{item.content}</div>
    </button>
  );
}

export default function RightAgentDrawer({
  isOpen,
  mode,
  suggestions,
  onToggleMode,
  onClose,
  activeSuggestion,
  chatMessages,
  chatInput,
  isChatLoading,
  isChatConverting,
  onChatInputChange,
  onChatSubmit,
  onChatConvertToNodes,
  onChatContextSelect,
}) {
  const contextItems = suggestions.slice(0, 2);
  const hasTipSignal = suggestions.length > 0;
  const isTip = mode === "tip";
  const isChat = mode === "chat";
  const categoryColors = CATEGORY_COLORS[activeSuggestion?.category] || CATEGORY_COLORS.What;
  const drawerFieldBaseFade =
    "linear-gradient(90deg, rgba(166,255,211,0) 0%, rgba(166,255,211,0.70) 24%, rgba(166,255,211,1) 46%)";
  const drawerFieldRadialAlpha =
    "radial-gradient(100.27% 97.75% at 97.75% 50%, rgba(224,255,244,0.94) 0%, rgba(174,241,218,0.84) 22.12%, rgba(187,216,230,0.42) 80.17%, rgba(255,255,234,0) 100%)";
  const drawerFieldLemonStrip =
    "linear-gradient(90deg, rgba(241,255,138,0.92) 0%, rgba(241,255,138,0.58) 36%, rgba(241,255,138,0) 100%)";
  const drawerFieldEdgeOverlay =
    "linear-gradient(90deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0) 100%)";
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !isChat) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading, isOpen, isChat]);

  const handleChatSubmit = (event) => {
    event.preventDefault();
    onChatSubmit?.();
  };

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-[45] overflow-hidden">
      <div
        className={`relative flex h-full w-[508px] transform-gpu transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-[430px]"
        }`}
      >
        <div className="pointer-events-auto relative w-[78px]">
          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white/10 to-transparent" />
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
            background: `${drawerFieldRadialAlpha}, ${drawerFieldBaseFade}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[0] w-[88px]"
            aria-hidden
            style={{ background: drawerFieldLemonStrip }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16"
            aria-hidden
            style={{ background: drawerFieldEdgeOverlay }}
          />
          <div
            className="relative z-10 flex h-full flex-col gap-3 pb-4 pl-10 pr-7"
            style={{ paddingTop: DRAWER_TOP_SAFE_ZONE }}
          >
            <div className="grid grid-cols-2 gap-2">
              {contextItems.length > 0 ? (
                contextItems.map((item) => (
                  <ContextMiniCard
                    key={item.id}
                    item={item}
                    isActive={activeSuggestion?.id === item.id}
                    onSelect={onChatContextSelect}
                  />
                ))
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
                  <div className="flex h-full min-h-0 flex-col gap-2">
                    {activeSuggestion ? (
                      <div className={`rounded-xl border ${categoryColors.border} ${categoryColors.bg} px-2.5 py-2`}>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${categoryColors.text}`}>
                          {activeSuggestion.category} · {activeSuggestion.phase}
                        </div>
                        <div className="font-heading mt-1 line-clamp-1 text-xs font-semibold text-slate-800">
                          {activeSuggestion.title}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/70 bg-white/35 px-3 py-2 text-xs text-slate-600">
                        Select a context card to start chat.
                      </div>
                    )}

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
                      <div className="flex flex-col gap-2">
                        {chatMessages.length === 0 && !isChatLoading && activeSuggestion && (
                          <div className="text-center text-xs text-slate-500">AI is preparing a response...</div>
                        )}
                        {chatMessages.map((msg, index) => (
                          <div
                            key={`${msg.role}-${index}`}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                msg.role === "user"
                                  ? "rounded-br-sm bg-indigo-500 text-white"
                                  : "rounded-bl-sm border border-white/70 bg-white/70 text-slate-700"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="inline-flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-white/70 bg-white/72 px-2.5 py-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                              <span className="text-xs text-slate-500">Thinking...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                    </div>

                    <div className="border-t border-white/65 pt-2">
                      <form onSubmit={handleChatSubmit} className="flex items-center gap-1.5">
                        <input
                          value={chatInput}
                          onChange={(event) => onChatInputChange?.(event.target.value)}
                          placeholder={activeSuggestion ? "Continue the idea..." : "Select a context card to chat"}
                          disabled={isChatLoading || !activeSuggestion}
                          className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white/82 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-300"
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || !chatInput?.trim() || !activeSuggestion}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500 text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Send message"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                      {activeSuggestion && chatMessages.length >= 2 && (
                        <button
                          type="button"
                          onClick={onChatConvertToNodes}
                          disabled={isChatConverting}
                          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-55"
                        >
                          {isChatConverting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Creating nodes...
                            </>
                          ) : (
                            <>
                              <GitBranch className="h-3 w-3" />
                              Convert conversation to nodes
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
