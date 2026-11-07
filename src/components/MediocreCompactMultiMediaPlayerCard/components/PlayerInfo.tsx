import { useContext } from "preact/hooks";
import { Icon, usePlayer } from "@components";
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
    minWidth: 0,
    width: "100%",
    opacity: 0.8,
    color: "var(--mmpc-meta-secondary-color, " + theme.colors.onCardMuted + ")",
    "--icon-primary-color":
      "var(--mmpc-meta-secondary-color, " + theme.colors.onCardMuted + ")",
  }),
  friendlyName: css({
    fontSize: "10.5px",
    fontWeight: 500,
    lineHeight: 1.15,
    color: "inherit",
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
  const { selectedPlayer: { entity_id, name } = {} } = useSelectedPlayer();
  const {
    state,
    attributes: { friendly_name: playerName, icon, device_class: deviceClass },
  } = usePlayer();

  if (!entity_id || state === "off" || state === "unavailable") {
    return null;
  }

  const showName = config?.options?.show_player_name !== false;
  if (!showName) {
    return null;
  }

  const mdiIcon = getDeviceIcon({ icon, deviceClass });

  return (
    <div css={styles.root}>
      <Icon icon={mdiIcon} size={"xxx-small"} />
      <span css={styles.friendlyName}>{name ?? playerName}</span>
    </div>
  );
};
