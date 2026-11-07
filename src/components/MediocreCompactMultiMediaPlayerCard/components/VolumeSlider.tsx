import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import {
  CardContext,
  CardContextType,
  IconButton,
  usePlayer,
} from "@components";
import { Fragment } from "preact/jsx-runtime";
import { getHass, getVolumeIcon, setVolume } from "@utils";
import { css } from "@emotion/react";
import { MediocreMultiMediaPlayerCardConfig } from "@types";
import { useSelectedPlayer } from "@components/SelectedPlayerContext";

const styles = {
  overlay: css({
    position: "absolute",
    inset: 0,
    zIndex: 4,
    backgroundColor: "rgba(20, 20, 32, 0.72)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 9px",
    overflow: "hidden",
    userSelect: "none",
    WebkitUserSelect: "none",
  }),
  rangeInput: css({
    "--slider-track-size": "56px",
    "--slider-thumb-size": "56px",
    "--slider-track-radius": "0px",
    "--slider-thumb-radius": "0px",
    "--slider-track-color": "transparent",
    "--slider-fill-color": "rgba(137, 180, 250, 0.68)",
    "--slider-thumb-color": "transparent",
    "--slider-direction": "to right",
    "&:dir(rtl)": {
      "--slider-direction": "to left",
    },
    "--attr-min": "attr(min type(<number>), 0)",
    "--attr-max": "attr(max type(<number>), 100)",
    "--control-value": "attr(value type(<number>), 50)",
    "--slider-progress":
      "calc(progress(var(--control-value), var(--attr-min), var(--attr-max)) * 100%)",
    "@supports not (opacity: progress(1, 0, 100))": {
      "--slider-progress":
        "calc((var(--control-value) - var(--attr-min)) / (var(--attr-max) - var(--attr-min)) * 100%)",
    },
    position: "absolute",
    inset: 0,
    appearance: "none",
    WebkitAppearance: "none",
    inlineSize: "100%",
    blockSize: "100%",
    margin: 0,
    padding: 0,
    border: 0,
    borderRadius: 0,
    background: "transparent",
    cursor: "pointer",
    zIndex: 1,
    "&:focus-visible": {
      outline: "2px solid var(--primary-color, #89b4fa)",
      outlineOffset: "-2px",
    },
    "&::-webkit-slider-runnable-track": {
      blockSize: "var(--slider-track-size)",
      border: 0,
      borderRadius: "var(--slider-track-radius)",
      background:
        "linear-gradient(var(--slider-direction), rgba(137, 180, 250, 0.55) 0%, var(--slider-fill-color) var(--slider-progress), var(--slider-track-color) var(--slider-progress))",
    },
    "&::-webkit-slider-thumb": {
      WebkitAppearance: "none",
      appearance: "none",
      inlineSize: "4px",
      blockSize: "var(--slider-thumb-size)",
      marginBlockStart:
        "calc((var(--slider-track-size) - var(--slider-thumb-size)) / 2)",
      border: 0,
      borderRadius: "var(--slider-thumb-radius)",
      background: "var(--slider-thumb-color)",
    },
    "&::-moz-range-track": {
      blockSize: "var(--slider-track-size)",
      border: 0,
      borderRadius: "var(--slider-track-radius)",
      background: "var(--slider-track-color)",
    },
    "&::-moz-range-progress": {
      blockSize: "var(--slider-track-size)",
      borderRadius: "var(--slider-track-radius)",
      background: "var(--slider-fill-color)",
    },
    "&::-moz-range-thumb": {
      inlineSize: "4px",
      blockSize: "var(--slider-thumb-size)",
      border: 0,
      borderRadius: "var(--slider-thumb-radius)",
      background: "var(--slider-thumb-color)",
    },
  }),
  contentRow: css({
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  }),
  leftGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  }),
  rightGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  }),
  muteBadge: css({
    width: "38px",
    height: "38px",
    minWidth: "38px",
    minHeight: "38px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
    pointerEvents: "auto",
  }),
  actionButton: css({
    width: "34px",
    height: "34px",
    minWidth: "34px",
    minHeight: "34px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
    pointerEvents: "auto",
  }),
  stepButton: css({
    width: "30px",
    height: "30px",
    minWidth: "30px",
    minHeight: "30px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.45)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
    pointerEvents: "auto",
  }),
  label: css({
    fontSize: "14px",
    fontWeight: 700,
    color: "#ffffff",
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  percentText: css({
    fontSize: "14px",
    fontWeight: 700,
    color: "#ffffff",
    marginRight: "2px",
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
  }),
  groupBtnWrapper: css({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto",
  }),
  groupBadge: css({
    position: "absolute",
    top: "-2px",
    right: "-3px",
    minWidth: "16px",
    height: "15px",
    padding: "0 4px",
    borderRadius: "999px",
    backgroundColor: "var(--primary-color, #89b4fa)",
    color: "#11111b",
    fontSize: "9.5px",
    fontWeight: 700,
    lineHeight: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.45)",
    zIndex: 3,
  }),
};

export type VolumeSliderProps = {
  onClose?: () => void;
  onToggleGrouping?: () => void;
  extraGroupCount?: number;
};

export const VolumeSlider = ({
  onClose,
  onToggleGrouping,
  extraGroupCount = 0,
}: VolumeSliderProps = {}) => {
  const { config } =
    useContext<CardContextType<MediocreMultiMediaPlayerCardConfig>>(
      CardContext
    );
  const { selectedPlayer: { entity_id, speaker_group_entity_id, name } = {} } =
    useSelectedPlayer();
  const player = usePlayer();
  const volume = player.attributes?.volume_level ?? 0;
  const volumeMuted = player.attributes?.is_volume_muted ?? false;
  const targetEntityId = speaker_group_entity_id ?? entity_id;
  const showStepButtons = config.options?.show_volume_step_buttons ?? false;
  const useVolumeUpDownForSteps =
    config.options?.use_volume_up_down_for_step_buttons ?? false;

  const [internalValue, setInternalValue] = useState<number>(
    Math.round(volume * 100)
  );
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    setInternalValue(Math.round(volume * 100));
  }, [volume]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const handleToggleMute = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (!entity_id) return;
      getHass().callService("media_player", "volume_mute", {
        entity_id,
        is_volume_muted: !volumeMuted,
      });
    },
    [entity_id, volumeMuted]
  );

  const handleStep = useCallback(
    (direction: "increment" | "decrement", e: MouseEvent) => {
      e.stopPropagation();
      if (!targetEntityId) return;
      if (useVolumeUpDownForSteps) {
        getHass().callService(
          "media_player",
          direction === "increment" ? "volume_up" : "volume_down",
          { entity_id: targetEntityId }
        );
      } else {
        const nextVal = Math.max(
          0,
          Math.min(100, internalValue + (direction === "increment" ? 5 : -5))
        );
        setInternalValue(nextVal);
        setVolume(targetEntityId, nextVal / 100, true);
      }
    },
    [targetEntityId, useVolumeUpDownForSteps, internalValue]
  );

  const handleInput = useCallback(
    (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      const newVal = Number(target.value);
      setInternalValue(newVal);
      if (!targetEntityId) return;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        setVolume(targetEntityId, newVal / 100, true);
      }, 150);
    },
    [targetEntityId]
  );

  const handleChange = useCallback(
    (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      const newVal = Number(target.value);
      setInternalValue(newVal);
      if (!targetEntityId) return;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      setVolume(targetEntityId, newVal / 100, true);
    },
    [targetEntityId]
  );

  const VolumeIcon = useMemo(
    () => getVolumeIcon(internalValue / 100, volumeMuted),
    [internalValue, volumeMuted]
  );

  if (!entity_id) return null;

  const displayName =
    name ?? player.attributes?.friendly_name ?? player.title ?? "Volume";

  return (
    <div css={styles.overlay} onClick={e => e.stopPropagation()}>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={internalValue}
        aria-label={`${displayName} Volume`}
        aria-valuetext={`${internalValue}%`}
        css={styles.rangeInput}
        style={{
          "--attr-min": "0",
          "--attr-max": "100",
          "--control-value": String(internalValue),
        }}
        onInput={handleInput}
        onChange={handleChange}
      />
      <div css={styles.contentRow}>
        <div css={styles.leftGroup}>
          <IconButton
            css={styles.muteBadge}
            style={{ "--mmpc-icon-button-size": "19px" }}
            size="small"
            onClick={handleToggleMute}
            icon={VolumeIcon}
          />
          <span css={styles.label}>{displayName}</span>
        </div>
        <div css={styles.rightGroup}>
          {showStepButtons && (
            <IconButton
              css={styles.stepButton}
              style={{ "--mmpc-icon-button-size": "16px" }}
              size="x-small"
              onClick={e => handleStep("decrement", e)}
              icon={"mdi:minus"}
            />
          )}
          <span css={styles.percentText}>{internalValue}%</span>
          {showStepButtons && (
            <IconButton
              css={styles.stepButton}
              style={{ "--mmpc-icon-button-size": "16px" }}
              size="x-small"
              onClick={e => handleStep("increment", e)}
              icon={"mdi:plus"}
            />
          )}
          {onToggleGrouping && (
            <div css={styles.groupBtnWrapper}>
              <IconButton
                id="mmpc-compact-volume-grouping-toggle"
                css={styles.actionButton}
                style={{ "--mmpc-icon-button-size": "18px" }}
                size="x-small"
                onClick={e => {
                  e.stopPropagation();
                  onToggleGrouping();
                }}
                icon={"mdi:speaker-multiple"}
              />
              {extraGroupCount > 0 && (
                <span css={styles.groupBadge}>+{extraGroupCount}</span>
              )}
            </div>
          )}
          {onClose && (
            <IconButton
              id="mmpc-compact-volume-close"
              css={styles.actionButton}
              style={{ "--mmpc-icon-button-size": "18px" }}
              size="x-small"
              onClick={e => {
                e.stopPropagation();
                onClose();
              }}
              icon={"mdi:close"}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const VolumeTrigger = ({
  sliderVisible,
  setSliderVisible,
}: {
  sliderVisible: boolean;
  setSliderVisible: (newValue: boolean) => void;
}) => {
  const player = usePlayer();

  const volume = player.attributes?.volume_level ?? 0;
  const volumeMuted = player.attributes?.is_volume_muted ?? false;
  const volumeIcon = getVolumeIcon(volume, volumeMuted);

  return (
    <Fragment>
      {!sliderVisible ? (
        <IconButton
          id="mmpc-compact-volume-toggle"
          css={styles.actionButton}
          style={{ "--mmpc-icon-button-size": "18px" }}
          size="x-small"
          onClick={() => setSliderVisible(true)}
          icon={volumeIcon}
        />
      ) : (
        <IconButton
          id="mmpc-compact-volume-toggle"
          css={styles.actionButton}
          style={{ "--mmpc-icon-button-size": "18px" }}
          size="x-small"
          onClick={() => setSliderVisible(false)}
          icon={"mdi:close"}
        />
      )}
    </Fragment>
  );
};
