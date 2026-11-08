import { useContext, useMemo, useState } from "preact/hooks";
import type {
  MediaPlayerEntity,
  MediocreMultiMediaPlayerCardConfig,
} from "@types";
import { Fragment } from "preact/jsx-runtime";
import {
  CardContext,
  CardContextType,
  useHass,
  GroupVolumeController,
  IconButton,
  PlayerContextProvider,
  Chip,
  Icon,
  AlbumArt,
} from "@components";
import { GroupChipsController } from "@components/GroupChipsController";
import { css } from "@emotion/react";
import { theme } from "@constants";
import { useIntl } from "@components/i18n";
import { useSelectedPlayer } from "@components/SelectedPlayerContext";
import { getHass, getSupportedFeatures } from "@utils";

const styles = {
  speakerGroupContainer: css({
    display: "flex",
    flexDirection: "column",
    padding: "12px 14px 14px 14px",
    gap: "10px",
    boxSizing: "border-box",
  }),
  groupTitle: css({
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.colors.onCardMuted,
    margin: "0 4px",
  }),
  linkPill: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: "26px",
    padding: "0 10px",
    borderRadius: "13px",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: theme.colors.onCardMuted,
    "--icon-primary-color": theme.colors.onCardMuted,
    fontSize: "11.5px",
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
  }),
  linkPillActive: css({
    backgroundColor: "rgba(137, 180, 250, 0.18)",
    border: "1px solid rgba(137, 180, 250, 0.38)",
    color: "#cdd6f4",
    "--icon-primary-color": "#cdd6f4",
  }),
  groupedSpeakers: css({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }),
  titleRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  playerChips: css({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "6px",
  }),
  chipPlayer: css({
    padding: "0px 8px 0px 6px",
    gap: 6,
    marginRight: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.9)",
    "--icon-primary-color": "rgba(255, 255, 255, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  }),
  chipPlayerOff: css({
    opacity: 0.65,
  }),
  chipPlayerArtwork: css({
    borderRadius: "50%",
  }),
};

export const SpeakerGrouping = () => {
  const { selectedPlayer, setSelectedPlayer } = useSelectedPlayer();
  const { t } = useIntl();
  const { config } =
    useContext<CardContextType<MediocreMultiMediaPlayerCardConfig>>(
      CardContext
    );
  const hass = useHass();

  const { media_players } = config;
  const { entity_id, speaker_group_entity_id } = selectedPlayer || {};
  // TODO: Volume sync should be liftet to a context so it is also active for the main mini player
  const [syncMainSpeakerVolume, setSyncMainSpeakerVolume] = useState(true);

  // Use the specified entity_id for the group or fall back to the main entity_id
  const mainEntityId = speaker_group_entity_id || entity_id;

  const enrichedEntities = useMemo(() => {
    return (
      media_players.map(player => {
        const playerState = hass.states[player.entity_id] as MediaPlayerEntity;
        const groupPlayerState = hass.states[
          player.speaker_group_entity_id || player.entity_id
        ] as MediaPlayerEntity;
        const groupArray = groupPlayerState?.attributes?.group_members ?? [];
        const isChildInGroup =
          groupArray.length === 0
            ? false
            : groupArray[0] !== groupPlayerState.entity_id;
        return {
          ...playerState,
          name: player.name ?? playerState?.attributes?.friendly_name,
          groupPlayerState,
          isChildInGroup,
          numPlayersInGroup: (groupPlayerState?.attributes?.group_members ?? [])
            .length,
          isMainSpeaker: player.entity_id === entity_id,
          selectPlayer: () => setSelectedPlayer(player),
        };
      }) ?? []
    );
  }, [hass, entity_id, media_players, setSelectedPlayer]);

  const groupableEntities = useMemo(() => {
    return media_players
      .filter(player => player.can_be_grouped)
      .map(player => {
        if (player.name) {
          return {
            name: player.name,
            entity: player.speaker_group_entity_id ?? player.entity_id,
          };
        } else {
          return player.speaker_group_entity_id ?? player.entity_id;
        }
      });
  }, [media_players]);

  const renderPlayer = (player: (typeof enrichedEntities)[number]) => {
    if (!player || player.isChildInGroup) {
      return null;
    }

    return (
      <PlayerContextProvider key={player.entity_id} entityId={player.entity_id}>
        {({ player: { state } }) => {
          const { supportsPause, supportsStop } = getSupportedFeatures(
            state,
            player.attributes ?? {}
          );
          return (
            <Chip
              css={[
                styles.chipPlayer,

                player.state === "off" && styles.chipPlayerOff,
              ]}
              onClick={() => player.selectPlayer()}
            >
              <AlbumArt
                size={22}
                iconSize="x-small"
                css={styles.chipPlayerArtwork}
                onClick={player.selectPlayer}
              />

              {`${player.name}${player.numPlayersInGroup > 1 ? ` +${player.numPlayersInGroup - 1}` : ""}`}

              {state === "playing" || state === "paused" ? (
                <IconButton
                  size="x-small"
                  onClick={e => {
                    e.stopPropagation();

                    e.preventDefault();

                    if (state === "playing") {
                      getHass().callService(
                        "media_player",
                        supportsPause
                          ? "media_pause"
                          : supportsStop
                            ? "media_stop"
                            : "media_play_pause",
                        { entity_id: player.entity_id }
                      );
                    } else {
                      getHass().callService("media_player", "media_play", {
                        entity_id: player.entity_id,
                      });
                    }
                  }}
                  icon={
                    state === "playing"
                      ? supportsPause
                        ? "mdi:pause-circle-outline"
                        : "mdi:stop-circle-outline"
                      : "mdi:play-circle-outline"
                  }
                />
              ) : state === "off" || state === "idle" ? (
                <IconButton
                  size="x-small"
                  onClick={e => {
                    e.stopPropagation();

                    e.preventDefault();

                    getHass().callService("media_player", "toggle", {
                      entity_id: player.entity_id,
                    });
                  }}
                  icon="mdi:power"
                />
              ) : (
                <Icon size="x-small" icon="mdi:circle-small" />
              )}
            </Chip>
          );
        }}
      </PlayerContextProvider>
    );
  };

  if (!entity_id || !mainEntityId) return null;

  const mainEntity = hass.states[mainEntityId] as MediaPlayerEntity;
  const isGrouped = (mainEntity?.attributes?.group_members?.length ?? 0) > 1;

  return (
    <div css={styles.speakerGroupContainer}>
      {isGrouped && (
        <Fragment>
          <div css={styles.titleRow}>
            <h3 css={styles.groupTitle}>
              {t({
                id: "MediocreMediaPlayerCard.SpeakerGrouping.grouped_speakers_title",
              })}
            </h3>
            <button
              type="button"
              css={[
                styles.linkPill,
                syncMainSpeakerVolume && styles.linkPillActive,
              ]}
              onClick={() => setSyncMainSpeakerVolume(!syncMainSpeakerVolume)}
            >
              <Icon
                icon={
                  syncMainSpeakerVolume
                    ? "mdi:check-circle"
                    : "mdi:circle-outline"
                }
                size="xx-small"
              />
              <span>
                {t({
                  id: "MediocreMediaPlayerCard.SpeakerGrouping.link_volume_title",
                })}
              </span>
            </button>
          </div>
          <div css={styles.groupedSpeakers}>
            <GroupVolumeController
              config={{
                entity_id,
                speaker_group: {
                  entities: groupableEntities,
                  entity_id: mainEntityId,
                },
                options: {
                  show_volume_step_buttons:
                    config.options?.show_volume_step_buttons ?? false,
                  use_volume_up_down_for_step_buttons:
                    config.options?.use_volume_up_down_for_step_buttons ??
                    false,
                },
              }}
              syncMainSpeaker={syncMainSpeakerVolume}
            />
          </div>
        </Fragment>
      )}
      {!isGrouped && (
        <h3 css={styles.groupTitle}>
          {t({
            id: "MediocreMediaPlayerCard.SpeakerGrouping.add_speakers_title",
          })}
        </h3>
      )}
      <GroupChipsController
        config={{
          entity_id: mainEntityId,
          speaker_group: { entities: groupableEntities },
        }}
        showGrouped={false}
        layout={{ horizontalMargin: 0 }}
      />
      {!config.disable_player_focus_switching && (
        <Fragment>
          <h3 css={styles.groupTitle}>
            {t({
              id: "MediocreMultiMediaPlayerCard.SpeakerGrouping.player_focus_title",
            })}
          </h3>
          <div css={styles.playerChips}>
            {enrichedEntities.length > 0 && enrichedEntities.map(renderPlayer)}
          </div>
        </Fragment>
      )}
    </div>
  );
};
