"use client";

export default function RightAgentDrawer({
  isOpen,
  mode,
  suggestions,
  onToggleMode,
}) {
  const hasTipSignal = suggestions.length > 0;
  const isTip = mode === "tip";
  const isChat = mode === "chat";

  return (
    <div className="pointer-events-none absolute bottom-10 right-0 top-10 z-[45]">
      <div className="pointer-events-auto relative h-full">
        <div
          className={`absolute right-0 top-0 h-full transition-[width,opacity] duration-300 ${
            isOpen ? "w-[124px] opacity-100" : "w-0 opacity-0"
          }`}
          aria-hidden={!isOpen}
          style={{
            background:
              "linear-gradient(90deg, rgba(174,231,208,0.96) 0%, rgba(174,231,208,0.9) 32%, rgba(221,240,195,0.9) 63%, rgba(215,232,238,0.94) 100%)",
          }}
        />

        <div className="absolute right-8 top-[58%] z-20 flex -translate-y-1/2 flex-col items-center gap-[10px]">
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
    </div>
  );
}
