import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import type {
  CommonMediocreMediaPlayerCardConfig,
  MediaPlayerConfigEntity,
} from "@types";
import { IconButton, useHass } from "@components";
import { getHass, getVolumeIcon, setVolume } from "@utils";
import { css } from "@emotion/react";

const styles = {
  speakersList: css({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  }),
  speakerPill: css({
    position: "relative",
    height: "44px",
    minHeight: "44px",
    borderRadius: "22px",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 8px 0 6px",
    overflow: "hidden",
    boxSizing: "border-box",
    userSelect: "none",
    WebkitUserSelect: "none",
  }),
  speakerPillOff: css({
    opacity: 0.65,
  }),
  rangeInput: css({
    "--slider-track-size": "44px",
    "--slider-thumb-size": "44px",
    "--slider-track-radius": "0px",
    "--slider-thumb-radius": "0px",
    "--slider-track-color": "transparent",
    "--slider-fill-color": "rgba(137, 180, 250, 0.65)",
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
        "linear-gradient(var(--slider-direction), rgba(137, 180, 250, 0.42) 0%, var(--slider-fill-color) var(--slider-progress), var(--slider-track-color) var(--slider-progress))",
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
    gap: "8px",
    pointerEvents: "none",
  }),
  leftGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flex: 1,
  }),
  rightGroup: css({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  }),
  muteBtn: css({
    width: "32px",
    height: "32px",
    minWidth: "32px",
    minHeight: "32px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.52)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    color: "#ffffff",
    "--icon-primary-color": "#ffffff",
    pointerEvents: "auto",
  }),
  miniBtn: css({
    width: "28px",
    height: "28px",
    minWidth: "28px",
    minHeight: "28px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.48)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.9)",
    "--icon-primary-color": "rgba(255, 255, 255, 0.9)",
    pointerEvents: "auto",
  }),
  speakerName: css({
    fontSize: "13px",
    fontWeight: 600,
    color: "#ffffff",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.45)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  speakerNameMain: css({
    fontWeight: 700,
  }),
  speakerPct: css({
    fontSize: "12.5px",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.92)",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.45)",
  }),
};

export type GroupSpeaker = {
  entity_id: string;
  name: string;
  volume: number;
  muted: boolean;
  isGrouped: boolean;
  isOff: boolean;
  isMainSpeaker: boolean;
};

type SpeakerVolumePillProps = {
  speaker: GroupSpeaker;
  isLoading: boolean;
  syncGroupChildren: boolean;
  showStepButtons: boolean;
  useVolumeUpDownForSteps: boolean;
  onToggleGroup: (speakerId: string, isGrouped: boolean) => void;
  onToggleMute: (entityId: string, isMuted: boolean) => void;
  onToggleOn: (entityId: string) => void;
};

const SpeakerVolumePill = ({
  speaker,
  isLoading,
  syncGroupChildren,
  showStepButtons,
  useVolumeUpDownForSteps,
  onToggleGroup,
  onToggleMute,
  onToggleOn,
}: SpeakerVolumePillProps) => {
  const { entity_id, name, volume, muted, isGrouped, isMainSpeaker, isOff } =
    speaker;
  const isDisabled = isLoading || (isMainSpeaker && !isGrouped);

  const [internalValue, setInternalValue] = useState<number>(
    Math.round(volume * 100)
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const draggingTimeout = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    if (!isDragging.current) {
      setInternalValue(Math.round(volume * 100));
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (draggingTimeout.current) clearTimeout(draggingTimeout.current);
    };
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onNativeChange = (e: Event) => {
      const target = e.currentTarget as HTMLInputElement;
      const newVal = Number(target.value);
      setInternalValue(newVal);
      setVolume(entity_id, newVal / 100, syncGroupChildren);
      if (draggingTimeout.current) clearTimeout(draggingTimeout.current);
      draggingTimeout.current = setTimeout(() => {
        isDragging.current = false;
      }, 200);
    };
    el.addEventListener("change", onNativeChange);
    return () => {
      el.removeEventListener("change", onNativeChange);
    };
  }, [entity_id, syncGroupChildren, isOff]);

  const handleInput = useCallback((e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    if (draggingTimeout.current) clearTimeout(draggingTimeout.current);
    isDragging.current = true;
    setInternalValue(Number(target.value));
  }, []);

  const handleStep = useCallback(
    (direction: "increment" | "decrement", e: MouseEvent) => {
      e.stopPropagation();
      if (useVolumeUpDownForSteps) {
        getHass().callService(
          "media_player",
          direction === "increment" ? "volume_up" : "volume_down",
          { entity_id }
        );
      } else {
        const nextVal = Math.max(
          0,
          Math.min(100, internalValue + (direction === "increment" ? 5 : -5))
        );
        setInternalValue(nextVal);
        setVolume(entity_id, nextVal / 100, syncGroupChildren);
      }
    },
    [entity_id, useVolumeUpDownForSteps, internalValue, syncGroupChildren]
  );

  const volumeIcon = useMemo(
    () => getVolumeIcon(internalValue / 100, muted),
    [internalValue, muted]
  );

  return (
    <div css={[styles.speakerPill, isOff && styles.speakerPillOff]}>
      {!isOff && (
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={100}
          step={1}
          value={internalValue}
          aria-label={`${name} Volume`}
          aria-valuetext={`${internalValue}%`}
          css={styles.rangeInput}
          style={{
            "--attr-min": "0",
            "--attr-max": "100",
            "--control-value": String(internalValue),
          }}
          onInput={handleInput}
        />
      )}
      <div css={styles.contentRow}>
        <div css={styles.leftGroup}>
          {isOff ? (
            <IconButton
              css={styles.muteBtn}
              style={{ "--mmpc-icon-button-size": "16px" }}
              size="x-small"
              onClick={e => {
                e.stopPropagation();
                onToggleOn(entity_id);
              }}
              icon="mdi:power"
              disabled={isDisabled}
            />
          ) : (
            <IconButton
              css={styles.muteBtn}
              style={{ "--mmpc-icon-button-size": "16px" }}
              size="x-small"
              onClick={e => {
                e.stopPropagation();
                onToggleMute(entity_id, muted);
              }}
              icon={volumeIcon}
            />
          )}
          <span
            css={[styles.speakerName, isMainSpeaker && styles.speakerNameMain]}
          >
            {name}
          </span>
        </div>
        <div css={styles.rightGroup}>
          {!isOff && showStepButtons && (
            <IconButton
              css={styles.miniBtn}
              style={{ "--mmpc-icon-button-size": "15px" }}
              size="x-small"
              onClick={e => handleStep("decrement", e)}
              icon="mdi:minus"
            />
          )}
          {!isOff && <span css={styles.speakerPct}>{internalValue}%</span>}
          {!isOff && showStepButtons && (
            <IconButton
              css={styles.miniBtn}
              style={{ "--mmpc-icon-button-size": "15px" }}
              size="x-small"
              onClick={e => handleStep("increment", e)}
              icon="mdi:plus"
            />
          )}
          <IconButton
            css={styles.miniBtn}
            style={{ "--mmpc-icon-button-size": "15px" }}
            size="x-small"
            onClick={e => {
              e.stopPropagation();
              onToggleGroup(entity_id, isGrouped);
            }}
            icon={isGrouped ? "mdi:close" : "mdi:plus"}
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export type GroupVolumeControllerProps = {
  config: Pick<
    CommonMediocreMediaPlayerCardConfig,
    "speaker_group" | "entity_id"
  > &
    Partial<CommonMediocreMediaPlayerCardConfig>;
  syncMainSpeaker: boolean; // Wheter the main speaker will affect the volume of the group
  className?: string;
};

export const GroupVolumeController = ({
  config,
  syncMainSpeaker,
  className,
}: GroupVolumeControllerProps) => {
  const { speaker_group, entity_id } = config;

  const hass = useHass();

  const [playersLoading, setPlayersLoading] = useState<string[]>([]);

  // Use the specified entity_id for the group or fall back to the main entity_id
  const mainEntityId = speaker_group?.entity_id || entity_id;
  const mainEntity = hass.states[mainEntityId];

  // Get all available speakers that can be grouped
  const availableSpeakers: GroupSpeaker[] = useMemo(() => {
    if (!speaker_group?.entities?.length && !mainEntity) return [];

    const speakerEntities = [...(speaker_group?.entities || [])];

    // Add main entity if it exists and isn't already in the list
    if (
      mainEntity &&
      !speakerEntities.find(
        entity =>
          (typeof entity === "string" ? entity : entity.entity) === mainEntityId
      )
    ) {
      speakerEntities.push(mainEntityId);
    }

    const getEntityId = (entity: MediaPlayerConfigEntity) =>
      typeof entity === "string" ? entity : entity.entity;

    return speakerEntities
      .filter(entity => hass.states[getEntityId(entity)])
      .map(entity => ({
        entity_id: getEntityId(entity),
        name:
          typeof entity !== "string" && !!entity.name
            ? entity.name
            : (hass.states[getEntityId(entity)].attributes.friendly_name ??
              getEntityId(entity)),
        volume: hass.states[getEntityId(entity)].attributes.volume_level || 0,
        muted:
          hass.states[getEntityId(entity)].attributes.is_volume_muted || false,
        isOff: hass.states[getEntityId(entity)].state === "off",
        isGrouped:
          mainEntity?.attributes?.group_members?.includes(
            getEntityId(entity)
          ) || false,
        isMainSpeaker:
          mainEntity?.attributes?.group_members?.[0] === getEntityId(entity) ||
          false,
      }))
      .sort((a, b) => {
        if (a.entity_id === mainEntityId) return -1;
        if (b.entity_id === mainEntityId) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [hass.states, speaker_group, mainEntityId, mainEntity]);

  const joinSpeaker = useCallback(
    async (speakerId: string) => {
      const existingMembers = (
        mainEntity?.attributes?.group_members || []
      ).filter((id: string) => id !== mainEntityId);
      await hass.callService("media_player", "join", {
        entity_id: mainEntityId,
        group_members: [speakerId, ...existingMembers],
      });
    },
    [hass, mainEntityId, mainEntity]
  );

  // Handle joining/unjoining a speaker to/from the group
  const handleToggleGroup = useCallback(
    async (speakerId: string, isGrouped: boolean, retries = 0) => {
      if (playersLoading.includes(speakerId)) return;
      setPlayersLoading(prev => [...prev, speakerId]);
      try {
        const speaker = hass.states[speakerId];
        if (isGrouped) {
          // Remove from group
          await hass.callService("media_player", "unjoin", {
            entity_id: speakerId,
          });
        } else {
          // Add to group
          if (speaker.state === "off") {
            await hass.callService("media_player", "turn_on", {
              entity_id: speakerId,
            });
          }
          await joinSpeaker(speakerId);
        }
      } catch (e) {
        console.error(e);
        if (retries < 1) {
          setTimeout(
            () => handleToggleGroup(speakerId, isGrouped, retries + 1),
            1000
          );
        }
      }
      setPlayersLoading(prev => prev.filter(id => id !== speakerId));
    },
    [playersLoading, hass, joinSpeaker]
  );

  const handleToggleMute = useCallback((entityId: string, isMuted: boolean) => {
    getHass().callService("media_player", "volume_mute", {
      entity_id: entityId,
      is_volume_muted: !isMuted,
    });
  }, []);

  const handleToggleOn = useCallback((entityId: string) => {
    getHass().callService("media_player", "turn_on", { entity_id: entityId });
  }, []);

  const showStepButtons = config.options?.show_volume_step_buttons ?? false;
  const useVolumeUpDownForSteps =
    config.options?.use_volume_up_down_for_step_buttons ?? false;

  return (
    <div className={className} css={styles.speakersList}>
      {availableSpeakers
        .filter(speaker => speaker.isGrouped)
        .map(speaker => (
          <SpeakerVolumePill
            key={speaker.entity_id}
            speaker={speaker}
            isLoading={playersLoading.includes(speaker.entity_id)}
            syncGroupChildren={speaker.isMainSpeaker && syncMainSpeaker}
            showStepButtons={showStepButtons}
            useVolumeUpDownForSteps={useVolumeUpDownForSteps}
            onToggleGroup={handleToggleGroup}
            onToggleMute={handleToggleMute}
            onToggleOn={handleToggleOn}
          />
        ))}
    </div>
  );
};
