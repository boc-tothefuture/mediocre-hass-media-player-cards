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
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "3px",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    padding: "1px 6px",
    borderRadius: "999px",
    flexShrink: 0,
    maxWidth: "140px",
  }),
  friendlyName: css({
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: 1.3,
    color: "var(--mmpc-meta-secondary-color, " + theme.colors.onCardMuted + ")",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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
    state,
    attributes: { friendly_name: playerName, icon, device_class: deviceClass },
  } = usePlayer();
  if (!entity_id || state === "off" || state === "unavailable") {
    return null;
  }
  const groupMembers =
    hass.states[speaker_group_entity_id ?? entity_id]?.attributes
      ?.group_members;
  const mdiIcon = getDeviceIcon({ icon, deviceClass });

  const showName = config?.options?.show_player_name !== false;
  const hasGroupMembers = Boolean(groupMembers && groupMembers.length > 1);

  if (!showName && !hasGroupMembers) {
    return null;
  }

  return (
    <div css={styles.root}>
      {showName && <Icon icon={mdiIcon} size={"xxx-small"} />}
      {showName && <span css={styles.friendlyName}>{name ?? playerName}</span>}
      {groupMembers && groupMembers.length > 1 && (
        <span css={styles.friendlyName}>+{groupMembers.length - 1}</span>
      )}
    </div>
  );
};
