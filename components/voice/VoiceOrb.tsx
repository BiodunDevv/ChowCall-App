import type { SessionState } from "./types";
import styles from "./VoiceOrb.module.css";

interface VoiceOrbProps {
  state: SessionState;
  captionsActive?: boolean;
}

export function VoiceOrb({ state, captionsActive = false }: VoiceOrbProps) {
  const isConnected =
    state === "listening" ||
    state === "thinking" ||
    state === "speaking" ||
    state === "connecting" ||
    state === "muted";

  const isSpeaking = state === "speaking";
  const isListening = state === "listening" || state === "connecting";
  const captionsClass = captionsActive ? styles.captionsActiveHidden : "";

  return (
    <div
      className={[
        styles.pulseContainer,
        isConnected ? styles.connected : styles.disconnected,
        captionsClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isConnected ? (
        <div className={styles.circleWrapper}>
          <div
            className={[
              styles.circleStack,
              isSpeaking ? styles.stackTalking : styles.stackListening,
            ].join(" ")}
          >
            <div className={styles.circleOuter} />
            <div className={styles.circleMid} />
            <div className={styles.circleInner} />
            <div
              className={[
                styles.circleBase,
                isListening ? styles.pulseListening : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>
        </div>
      ) : (
        <div className={styles.circleWrapperIdle}>
          <div className={styles.circleBaseIdle} />
        </div>
      )}
    </div>
  );
}
