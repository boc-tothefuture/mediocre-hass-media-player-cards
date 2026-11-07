import { Fragment } from "preact/jsx-runtime";
import { usePlayer } from "@components/PlayerContext";
import { useSelectedPlayer } from "@components/SelectedPlayerContext";
import { PlayerInfo } from "./PlayerInfo";
import { css } from "@emotion/react";
import { theme } from "@constants";

const styles = {
  titleText: css({
    margin: 0,
    fontSize: "13.5px",
    fontWeight: 700,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "var(--mmpc-meta-primary-color, " + theme.colors.onCard + ")",
  }),
  titleTextOff: css({
    fontSize: "14px",
    fontWeight: 600,
    opacity: 0.85,
  }),
  artistText: css({
    margin: 0,
    fontSize: "11.5px",
    fontWeight: 500,
    lineHeight: 1.15,
    color: "var(--mmpc-meta-secondary-color, " + theme.colors.onCardMuted + ")",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  artistTextOff: css({
    fontSize: "11.5px",
    opacity: 0.65,
  }),
};

export const MetaInfo = () => {
  const { title, subtitle, state, attributes } = usePlayer();
  const { selectedPlayer } = useSelectedPlayer();

  const isOffOrUnavailable = state === "off" || state === "unavailable";

  if (isOffOrUnavailable) {
    const playerName =
      selectedPlayer?.name ?? attributes?.friendly_name ?? title;
    return (
      <Fragment>
        {!!playerName && (
          <h3 css={[styles.titleText, styles.titleTextOff]}>{playerName}</h3>
        )}
        {!!title && (
          <p css={[styles.artistText, styles.artistTextOff]}>{title}</p>
        )}
      </Fragment>
    );
  }

  // On the base player, show only artist/band (or series info), omitting album name
  const displaySubtitle = attributes?.media_series_title
    ? subtitle
    : attributes?.media_artist;

  return (
    <Fragment>
      {!!title && <h3 css={styles.titleText}>{title}</h3>}
      {!!displaySubtitle && <p css={styles.artistText}>{displaySubtitle}</p>}
      <PlayerInfo />
    </Fragment>
  );
};
