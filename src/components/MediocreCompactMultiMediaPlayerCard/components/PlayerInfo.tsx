import { useContext } from "preact/hooks";
import { Icon, useHass, usePlayer } from "@components";
import { CardContext, CardContextType } from "@components/CardContext";
import type { MediocreMultiMediaPlayerCardConfig } from "@types";
import { getDeviceIcon } from "@utils";
import { css } from "@emotion/react";
import { theme } from "@constants";
import { useSelectedPlayer } from "@components/SelectedPlayerContext";

const styles = {
  root: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "4px",
  }),
  friendlyName: css({
    fontSize: "11px",
    color: theme.colors.onCardMuted,
    opacity: 0.8,
    fontStyle: "italic",
  }),
};

export const PlayerInfo = () => {
  const { config } =
    useContext<CardContextType<MediocreMultiMediaPlayerCardConfig>>(
      CardContext
    );
  const hass = useHass();
  const { selectedPlayer: { entity_id, speaker_group_entity_id, name } = {} } =
    useSelectedPlayer();
  const {
    attributes: { friendly_name: playerName, icon, device_class: deviceClass },
  } = usePlayer();
  if (!entity_id) {
    return null;
  }
  const groupMembers =
    hass.states[speaker_group_entity_id ?? entity_id]?.attributes
      ?.group_members;
  const mdiIcon = getDeviceIcon({ icon, deviceClass });

  return (
    <div css={styles.root}>
      <Icon icon={mdiIcon} size={"xx-small"} />
      {config?.options?.show_player_name !== false && (
        <span css={styles.friendlyName}>{name ?? playerName}</span>
      )}
      {groupMembers && groupMembers.length > 1 && (
        <span css={styles.friendlyName}>+{groupMembers.length - 1}</span>
      )}
    </div>
  );
};
