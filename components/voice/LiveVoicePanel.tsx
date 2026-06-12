import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconMicrophone } from "@tabler/icons-react";
import { VoiceOrb } from "./VoiceOrb";
import { LiveCaptions } from "./LiveCaptions";
import { VoiceControls } from "./VoiceControls";
import { VoiceWaves } from "./VoiceWaves";
import type { LiveCaption, SessionState } from "./types";

const STATE_LABEL: Record<SessionState, string> = {
  idle: "Let's talk",
  connecting: "Connecting...",
  listening: "Listening...",
  thinking: "Thinking...",
  speaking: "Speaking...",
  muted: "Muted",
  ended: "Session ended",
  error: "Unavailable",
  payment_pending: "Payment ready",
  paid: "Order placed!",
};

const ACTIVE_STATES: SessionState[] = [
  "connecting",
  "listening",
  "thinking",
  "speaking",
  "muted",
];

export function LiveVoicePanel({
  restaurantName,
  open,
  nextOpen,
  state,
  captions,
  error,
  disabled,
  cartCount,
  phone,
  captionsActive,
  onStart,
  onMute,
  onEnd,
  onToggleCaptions,
  onMenu,
  onCart,
}: {
  restaurantName: string;
  open?: boolean;
  nextOpen?: string | null;
  state: SessionState;
  captions: LiveCaption[];
  error?: string | null;
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
  const isActive = ACTIVE_STATES.includes(state);
  const showCaptions = captionsActive && captions.length > 0;
  const statusLabel = STATE_LABEL[state] ?? "Let's talk";
  const isIdle = state === "idle" || state === "ended" || state === "error" || state === "payment_pending" || state === "paid";

  return (
    /* Outer: full-height flex column, matches reference .chatbotArea */
    <div className="relative isolate flex h-full w-full flex-col items-center overflow-hidden bg-background">

      {/* Wave background — absolute at bottom, visible always */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-64 opacity-60">
        <VoiceWaves paused={isActive} />
      </div>

      {/* Center column — max-width mirrors reference min(450px,100%) */}
      <div className="relative z-10 flex w-full max-w-112.5 flex-1 flex-col items-center justify-center px-6">

        {error && (
          <Alert variant="destructive" className="mb-8 w-full text-left">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isIdle ? (
          /* ── Idle panel — matches reference idle/start screen ── */
          <div className="flex w-full flex-col items-center gap-8">

            {/* Agent details */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-lg font-semibold leading-tight">{restaurantName}</p>
              <p className="text-sm text-muted-foreground">
                {open === false
                  ? (nextOpen ? `Opens ${nextOpen} · ` : "Closed · ")
                  : open === true
                  ? "Open now · "
                  : ""}
                AI voice ordering
              </p>
            </div>

            {/* Orb */}
            <VoiceOrb state={state} />

            {/* Call to action */}
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-xl font-semibold tracking-tight">Let&apos;s talk</p>
              <p className="max-w-60 text-sm leading-relaxed text-muted-foreground">
                Talk like you would to a person. The assistant listens and responds.
              </p>
            </div>

            {state === "idle" && (
              <Button
                type="button"
                size="lg"
                onClick={onStart}
                disabled={disabled}
                className="gap-2 rounded-full px-8"
              >
                <IconMicrophone className="size-4" />
                Start Voice Order
              </Button>
            )}

            {(state === "ended" || state === "paid" || state === "payment_pending") && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onStart}
                className="gap-2 rounded-full px-8"
              >
                <IconMicrophone className="size-4" />
                New Conversation
              </Button>
            )}
          </div>
        ) : (
          /* ── Active session — matches reference ActiveSession.tsx ── */
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
            {showCaptions ? (
              <div className="flex min-h-0 w-full flex-1 items-center">
                <LiveCaptions captions={captions} />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <VoiceOrb state={state} captionsActive={captionsActive} />
                <p className="text-base font-medium text-muted-foreground">{statusLabel}</p>
                {state === "speaking" && (
                  <p className="text-xs text-muted-foreground">Talk to interrupt</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls bar — always at bottom, inside z-10 stacking context */}
      <div className="relative z-10 flex w-full shrink-0 justify-center px-4 pb-6 pt-4">
        <VoiceControls
          state={state}
          disabled={disabled}
          cartCount={cartCount}
          phone={phone}
          captionsActive={captionsActive}
          onStart={onStart}
          onMute={onMute}
          onEnd={onEnd}
          onToggleCaptions={onToggleCaptions}
          onMenu={onMenu}
          onCart={onCart}
        />
      </div>
    </div>
  );
}
