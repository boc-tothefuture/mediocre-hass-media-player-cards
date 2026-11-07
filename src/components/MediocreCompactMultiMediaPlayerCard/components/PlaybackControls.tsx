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
  frostedButtonSmall: css({
    width: "30px",
    height: "30px",
    minWidth: "30px",
    minHeight: "30px",
    padding: 0,
    backgroundColor: "rgba(16, 16, 26, 0.45)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
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
  buttonMuted: css({
    opacity: 0.7,
  }),
  shuffleButton: css({
    "@container (max-width: 480px)": {
      display: "none",
    },
  }),
  repeatButton: css({
    "@container (max-width: 480px)": {
      display: "none",
    },
  }),
  previousButton: css({
    "@container (max-width: 300px)": {
      display: "none",
    },
  }),
};

export const PlaybackControls = () => {
  const {
    attributes: { shuffle, repeat },
    state,
  } = usePlayer();

  const playing = state === "playing";

  const {
    supportPreviousTrack,
    supportNextTrack,
    supportsShuffle,
    supportsRepeat,
    supportsTogglePlayPause,
    supportsPause,
    supportsStop,
  } = useSupportedFeatures();

  const {
    togglePlayback,
    toggleRepeat,
    toggleShuffle,
    previousTrack,
    nextTrack,
    stop,
  } = usePlayerActions();

  return (
    <div css={styles.root}>
      {!!supportsShuffle && (
        <IconButton
          id="mmpc-compact-shuffle-toggle"
          css={[
            styles.frostedButtonSmall,
            styles.shuffleButton,
            ...(!shuffle ? [styles.buttonMuted] : []),
          ]}
          style={{ "--mmpc-icon-button-size": "16px" }}
          size="x-small"
          onClick={toggleShuffle}
          icon={shuffle ? "mdi:shuffle-variant" : "mdi:shuffle-disabled"}
        />
      )}
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
      {!!supportsRepeat && (
        <IconButton
          id="mmpc-compact-repeat-toggle"
          css={[
            styles.frostedButtonSmall,
            styles.repeatButton,
            ...(repeat === "off" ? [styles.buttonMuted] : []),
          ]}
          style={{ "--mmpc-icon-button-size": "16px" }}
          size="x-small"
          onClick={toggleRepeat}
          icon={
            repeat === "one"
              ? "mdi:repeat-once"
              : repeat === "all"
                ? "mdi:repeat"
                : "mdi:repeat-off"
          }
        />
      )}
    </div>
  );
};
