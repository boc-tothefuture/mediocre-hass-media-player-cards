import { IconButton, usePlayer } from "@components";
import { useSupportedFeatures } from "@hooks";
import { css } from "@emotion/react";
import { usePlayerActions } from "@hooks/usePlayerActions";

const styles = {
  root: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "5px",
    height: "38px",
  }),
  frostedButton: css({
    width: "34px",
    height: "34px",
    minWidth: "34px",
    minHeight: "34px",
    padding: 0,
    backgroundColor: "rgba(16, 16, 26, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
    "@media (hover: hover)": {
      "&:hover": {
        backgroundColor: "rgba(32, 32, 48, 0.75)",
      },
    },
  }),
  playButton: css({
    width: "38px",
    height: "38px",
    minWidth: "38px",
    minHeight: "38px",
    padding: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    color: "#161622",
    "--icon-primary-color": "#161622",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
    "@media (hover: hover)": {
      "&:hover": {
        backgroundColor: "#ffffff",
      },
    },
  }),
  previousButton: css({
    "@container (max-width: 300px)": {
      display: "none",
    },
  }),
};

export const PlaybackControls = () => {
  const { state } = usePlayer();

  const playing = state === "playing";

  const {
    supportPreviousTrack,
    supportNextTrack,
    supportsTogglePlayPause,
    supportsPause,
    supportsStop,
  } = useSupportedFeatures();

  const { togglePlayback, previousTrack, nextTrack, stop } = usePlayerActions();

  return (
    <div css={styles.root}>
      {!!supportPreviousTrack && (
        <IconButton
          id="mmpc-compact-previous-track"
          css={[styles.frostedButton, styles.previousButton]}
          style={{ "--mmpc-icon-button-size": "19px" }}
          size="small"
          onClick={previousTrack}
          icon={"mdi:skip-previous"}
        />
      )}
      {supportsTogglePlayPause ? (
        <IconButton
          id="mmpc-compact-play-pause-toggle"
          css={styles.playButton}
          style={{ "--mmpc-icon-button-size": "21px" }}
          size="medium"
          onClick={togglePlayback}
          icon={
            playing ? (supportsPause ? "mdi:pause" : "mdi:stop") : "mdi:play"
          }
        />
      ) : supportsStop ? (
        <IconButton
          id="mmpc-compact-stop"
          css={styles.playButton}
          style={{ "--mmpc-icon-button-size": "21px" }}
          size="medium"
          onClick={stop}
          icon={"mdi:stop"}
        />
      ) : null}
      {!!supportNextTrack && (
        <IconButton
          id="mmpc-compact-next-track"
          css={styles.frostedButton}
          style={{ "--mmpc-icon-button-size": "19px" }}
          size="small"
          onClick={nextTrack}
          icon={"mdi:skip-next"}
        />
      )}
    </div>
  );
};
