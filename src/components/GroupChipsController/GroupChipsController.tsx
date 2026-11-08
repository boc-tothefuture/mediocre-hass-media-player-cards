import { Chip, useHass } from "@components";
import { css } from "@emotion/react";
import {
  CommonMediocreMediaPlayerCardConfig,
  MediaPlayerConfigEntity,
} from "@types";
import { FC, useCallback, useMemo, useState } from "preact/compat";

const styles = {
  root: css({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "6px",
    justifyContent: "flex-start",
    padding: "0 var(--mmpc-chip-horizontal-margin, 0px)",
    boxSizing: "border-box",
  }),
  speakerChip: css({
    marginRight: 0,
    backgroundColor: "var(--mmpc-chip-background, rgba(255, 255, 255, 0.08))",
    color: "var(--mmpc-chip-foreground, rgba(255, 255, 255, 0.9))",
    "--icon-primary-color":
      "var(--mmpc-chip-foreground, rgba(255, 255, 255, 0.72))",
    border: "1px solid var(--mmpc-chip-border, rgba(255, 255, 255, 0.12))",
    fontSize: "12.5px",
    fontWeight: 600,
    gap: "6px",
  }),
};

export type GroupChipsControllerProps = {
  config: Pick<
    CommonMediocreMediaPlayerCardConfig,
    "speaker_group" | "entity_id"
  >;
  showGrouped: boolean;
  layout?: {
    horizontalMargin?: number;
  };
};

export const GroupChipsController: FC<GroupChipsControllerProps> = ({
  config,
  showGrouped,
  layout,
}) => {
  const hass = useHass();

  const { entity_id, speaker_group } = config;

  const [playersLoading, setPlayersLoading] = useState<string[]>([]);

  // Use the specified entity_id for the group or fall back to the main entity_id
  const mainEntityId = speaker_group?.entity_id || entity_id;
  const mainEntity = hass.states[mainEntityId];

  // Get all available speakers that can be grouped
  const availableSpeakers = useMemo(() => {
    if (!speaker_group?.entities?.length) return [];
    const getEntityId = (entity: MediaPlayerConfigEntity) =>
      typeof entity === "string" ? entity : entity.entity;

    return speaker_group.entities
      .filter(entity => getEntityId(entity) !== mainEntityId)
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
        isGrouped:
          mainEntity?.attributes?.group_members?.includes(
            getEntityId(entity)
          ) || false,
      }))
      .filter(speaker => {
        if (showGrouped) return true;
        return !speaker.isGrouped;
      })
      .sort((a, b) => {
        if (a.entity_id === mainEntityId) return -1;
        if (b.entity_id === mainEntityId) return 1;
        return a.name.localeCompare(b.name);
      })
      .sort((a, b) => {
        if (a.isGrouped && !b.isGrouped) return -1;
        if (!a.isGrouped && b.isGrouped) return 1;
        return 0;
      });
  }, [hass.states, speaker_group, showGrouped, mainEntityId, mainEntity]);

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

  return (
    <div
      css={styles.root}
      id="mmpc-group-chips-controller"
      style={{
        "--mmpc-chip-horizontal-margin": `${layout?.horizontalMargin ?? 0}px`,
      }}
    >
      {availableSpeakers.map(speaker => (
        <Chip
          css={styles.speakerChip}
          key={speaker.entity_id}
          loading={playersLoading.includes(speaker.entity_id)}
          onClick={() =>
            handleToggleGroup(speaker.entity_id, speaker.isGrouped)
          }
          icon={speaker.isGrouped ? "mdi:close" : "mdi:plus"}
          iconPosition="right"
        >
          {speaker.name}
        </Chip>
      ))}
    </div>
  );
};
