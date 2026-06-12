import type { SessionState } from "./types";
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerStop,
  IconShoppingCart,
  IconSubtitles,
  IconSubtitlesOff,
  IconToolsKitchen2,
} from "@tabler/icons-react";

export function VoiceControls({
  state,
  disabled,
  cartCount,
  captionsActive,
  onStart,
  onMute,
  onEnd,
  onToggleCaptions,
  onMenu,
  onCart,
}: {
  state: SessionState;
  disabled?: boolean;
  cartCount: number;
  phone?: string | null;
  captionsActive: boolean;
  onStart: () => void;
  onMute: () => void;
  onEnd: () => void;
  onToggleCaptions: () => void;
  onMenu: () => void;
  onCart: () => void;
}) {
  const active = ["connecting", "listening", "thinking", "speaking", "muted"].includes(state);
  const muted = state === "muted";

  return (
    <div className="flex items-center gap-2">
      {active ? (
        <>
          {/* CC toggle */}
          <button
            type="button"
            onClick={onToggleCaptions}
            aria-label={captionsActive ? "Hide captions" : "Show captions"}
            title={captionsActive ? "Hide captions" : "Show captions"}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          >
            {captionsActive ? (
              <IconSubtitles className="size-5" />
            ) : (
              <IconSubtitlesOff className="size-5" />
            )}
          </button>

          {/* Mic toggle — brand border */}
          <button
            type="button"
            onClick={onMute}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            title={muted ? "Unmute" : "Mute"}
            className="flex size-10 items-center justify-center rounded-full border border-primary bg-background text-primary transition-colors hover:bg-primary/10 active:scale-95"
            data-muted={muted}
          >
            {muted ? (
              <IconMicrophoneOff className="size-5" />
            ) : (
              <IconMicrophone className="size-5" />
            )}
          </button>

          {/* End / dismiss */}
          <button
            type="button"
            onClick={onEnd}
            aria-label="End session"
            title="End session"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          >
            <IconPlayerStop className="size-5" />
          </button>

          {/* Separator */}
          <div className="mx-1 h-5 w-px bg-border" />
        </>
      ) : null}

      {/* Menu — always visible */}
      <button
        type="button"
        onClick={onMenu}
        aria-label="Browse menu"
        className="flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
      >
        <IconToolsKitchen2 className="size-3.5" />
        Menu
      </button>

      {/* Cart — always visible */}
      <button
        type="button"
        onClick={onCart}
        aria-label="Open cart"
        className="relative flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted active:scale-95"
      >
        <IconShoppingCart className="size-3.5" />
        Cart
        {cartCount > 0 && (
          <span className="flex size-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
