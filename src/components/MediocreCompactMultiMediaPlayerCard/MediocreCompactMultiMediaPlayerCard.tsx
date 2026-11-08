import { CardContext, CardContextType } from "@components/CardContext";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import type { MediocreMultiMediaPlayerCardConfig } from "@types";
import {
  CustomButton,
  CustomButtons,
  MetaInfo,
  PlaybackControls,
  QueueView,
  Search,
  SpeakerGrouping,
} from "./components";
import {
  AdditionalActionsMenu,
  Icon,
  IconButton,
  useHass,
  usePlayer,
} from "@components";
import { VolumeSlider, VolumeTrigger } from "./components/VolumeSlider";
import { Fragment } from "preact/jsx-runtime";
import {
  useSupportedFeatures,
  useActionProps,
  useArtworkColors,
  useCanDisplayQueue,
} from "@hooks";
import { InteractionConfig } from "@types";
import { MassivePopUp } from "./components/MassivePopUp";
import {
  getDeviceIcon,
  getHasMediaBrowser,
  getHass,
  getHasSearch,
  getSourceIcon,
} from "@utils";
import { css } from "@emotion/react";
import { MediaBrowserBar } from "./components/MediaBrowserBar";
import { fadeIn, theme } from "@constants";
import { useSelectedPlayer } from "@components/SelectedPlayerContext";

const styles = {
  card: css({
    borderRadius: "28px",
    overflow: "hidden",
  }),
  artBackground: css({
    background: `
      radial-gradient( circle at bottom right, var(--art-alternative-color, transparent) -500%, transparent 30% ),
      radial-gradient( circle at top center, var(--art-alternative-color, transparent) -500%, transparent 30% ),
      radial-gradient( circle at bottom center, var(--art-alternative-color, transparent) -500%, transparent 30% ),
      radial-gradient( circle at top left, var(--art-alternative-color, transparent) -500%, transparent 30% )`,
  }),
  cardContent: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    height: "56px",
    minHeight: "56px",
    maxHeight: "56px",
    padding: "0 9px",
    borderRadius: "28px",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    containerType: "inline-size",
  }),
  cardContentExpanded: css({
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.28)",
  }),
  cardContentOff: css({
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    "@media (hover: hover)": {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
      },
    },
  }),
  cardContentWithArt: css({
    "--mmpc-meta-primary-color": "#ffffff",
    "--mmpc-meta-secondary-color": "rgba(255, 255, 255, 0.78)",
  }),
  bgArtImage: css({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0,
    zIndex: 0,
    pointerEvents: "none",
  }),
  bgArtImageLoaded: css({
    animation: `${fadeIn} 0.3s ease forwards`,
  }),
  bgArtScrim: css({
    position: "absolute",
    inset: 0,
    background: `linear-gradient(
      90deg,
      rgba(18, 16, 28, 0.88) 0%,
      rgba(22, 18, 35, 0.72) 38%,
      rgba(22, 18, 35, 0.28) 68%,
      rgba(18, 16, 28, 0.62) 100%
    )`,
    zIndex: 1,
    pointerEvents: "none",
  }),
  leftSection: css({
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    flex: 1,
    height: "100%",
  }),
  offBadge: css({
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    color: theme.colors.onCardMuted,
    "--icon-primary-color": theme.colors.onCardMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  onBadge: css({
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.55)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    color: theme.colors.onCard,
    "--icon-primary-color": theme.colors.onCard,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  metaButton: css({
    background: "none",
    border: "none",
    padding: 0,
    margin: 0,
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "1px",
    minWidth: 0,
    flex: 1,
    height: "100%",
    position: "relative",
    color: "inherit",
    fontFamily: "inherit",
  }),
  metaButtonWithArt: css({
    paddingLeft: "7px",
    textShadow: "0 1px 3px rgba(0, 0, 0, 0.55)",
  }),
  rightSection: css({
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "5px",
    flexShrink: 0,
  }),
  controlsContainer: css({
    display: "flex",
    alignItems: "center",
  }),
  frostedActionBtn: css({
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
  }),
  frostedActionBtnActive: css({
    backgroundColor: "rgba(137, 180, 250, 0.28)",
    borderColor: "rgba(137, 180, 250, 0.5)",
  }),
  frostedSubtleBtn: css({
    width: "30px",
    height: "30px",
    minWidth: "30px",
    minHeight: "30px",
    padding: 0,
    borderRadius: "50%",
    backgroundColor: "rgba(16, 16, 26, 0.42)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.9)",
    "--icon-primary-color": "rgba(255, 255, 255, 0.9)",
  }),
  groupBtnWrapper: css({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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

export type MediocreCompactMultiMediaPlayerCardProps = {
  isEmbeddedInMultiCard?: boolean;
  onClick?: () => void;
};

export const MediocreCompactMultiMediaPlayerCard = ({
  isEmbeddedInMultiCard,
  onClick,
}: MediocreCompactMultiMediaPlayerCardProps) => {
  const { rootElement, config } =
    useContext<CardContextType<MediocreMultiMediaPlayerCardConfig>>(
      CardContext
    );
  const { selectedPlayer, setSelectedPlayer, setLastInteraction } =
    useSelectedPlayer();
  const {
    ma_entity_id,
    ma_favorite_button_entity_id,
    lms_entity_id,
    search,
    media_browser,
    custom_buttons,
    alwaysShowCustomButtons,
    alwaysShowPowerButton,
    hide_when_off: hideWhenOff,
    hide_when_group_child: hideWhenGroupChild,
    use_art_colors,
    tap_opens_popup,
    entity_id,
    action,
    showSourceSelection,
  } = useMemo(() => {
    if (!selectedPlayer || config.size !== "compact") {
      return {};
    }
    return {
      ma_entity_id: selectedPlayer.ma_entity_id,
      ma_favorite_button_entity_id: selectedPlayer.ma_favorite_button_entity_id,
      lms_entity_id: selectedPlayer.lms_entity_id,
      search: selectedPlayer.search,
      media_browser: selectedPlayer.media_browser,
      custom_buttons: selectedPlayer.custom_buttons,
      alwaysShowPowerButton: config.options?.always_show_power_button,
      alwaysShowCustomButtons: config.options?.always_show_custom_buttons,
      hide_when_off: config.options?.hide_when_off,
      hide_when_group_child: config.options?.hide_when_group_child,
      tap_opens_popup: config.tap_opens_popup,
      use_art_colors: config.use_art_colors,
      entity_id: selectedPlayer.entity_id,
      action: selectedPlayer.action,
      showSourceSelection: config.options?.show_source_selection,
    };
  }, [config, selectedPlayer]);

  const hasCustomButtons = custom_buttons && custom_buttons.length > 0;
  const hasSearch =
    getHasSearch(search, ma_entity_id) && !isEmbeddedInMultiCard;
  const hasMediaBrowser =
    getHasMediaBrowser(media_browser) && !isEmbeddedInMultiCard;

  const [showGrouping, setShowGrouping] = useState(false);
  const [showCustomButtons, setShowCustomButtons] = useState(
    alwaysShowCustomButtons ?? false
  );
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const { artVars, haVars } = useArtworkColors();

  const player = usePlayer();
  const { state } = player;
  const {
    entity_picture,
    entity_picture_local,
    icon,
    device_class: deviceClass,
    source,
  } = player.attributes;
  const albumArt = entity_picture_local || entity_picture;

  const [artError, setArtError] = useState(false);
  const [artLoaded, setArtLoaded] = useState(false);
  const [artImage, setArtImage] = useState<HTMLImageElement | null>(null);
  const latestImageUrl = useRef<string | null | undefined>(null);

  const loadArtImage = useCallback((url?: string | null, retries = 0) => {
    if (!url) {
      setArtLoaded(false);
      setArtError(false);
      setArtImage(null);
      return;
    }
    setArtImage(null);
    setArtError(false);
    const img = new Image();
    img.onerror = () => {
      if (latestImageUrl.current !== url) return;
      if (retries < 2) {
        setTimeout(() => {
          if (latestImageUrl.current === url) {
            loadArtImage(url, retries + 1);
          }
        }, 500);
        return;
      }
      setArtError(true);
    };
    img.onloadstart = () => {
      if (latestImageUrl.current !== url) return;
      setArtLoaded(false);
      setArtError(false);
    };
    img.onload = () => {
      if (latestImageUrl.current !== url) return;
      setArtLoaded(true);
    };
    img.src = getHass().hassUrl(url);
    setArtImage(img);
    if (img.complete) {
      setArtError(false);
      setArtLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (latestImageUrl.current === albumArt) return;
    latestImageUrl.current = albumArt;
    loadArtImage(albumArt);
  }, [albumArt, loadArtImage]);

  const hasQueue =
    useCanDisplayQueue({ ma_entity_id, lms_entity_id }) &&
    !isEmbeddedInMultiCard;

  const hass = useHass();

  const isGroupChild = useMemo(() => {
    const selfId =
      selectedPlayer?.speaker_group_self_entity_id ||
      selectedPlayer?.speaker_group_entity_id ||
      entity_id;
    const groupingEntityId =
      selectedPlayer?.speaker_group_entity_id ?? entity_id;
    if (!groupingEntityId) return false;
    const entityState = hass.states[groupingEntityId];
    if (
      !entityState?.attributes?.group_members ||
      entityState.attributes.group_members.length === 0
    ) {
      return false;
    }
    return (
      entityState.attributes.group_members.length > 1 &&
      entityState.attributes.group_members[0] !== selfId
    );
  }, [selectedPlayer, hass, entity_id]);

  const extraGroupCount = useMemo(() => {
    const groupingEntityId =
      selectedPlayer?.speaker_group_entity_id ?? entity_id;
    if (!groupingEntityId) return 0;
    const groupMembers =
      hass.states[groupingEntityId]?.attributes?.group_members;
    if (!groupMembers || groupMembers.length <= 1) return 0;
    return groupMembers.length - 1;
  }, [selectedPlayer, hass, entity_id]);

  const supportedFeatures = useSupportedFeatures();
  const hasNoPlaybackControls =
    !supportedFeatures.supportsTogglePlayPause &&
    !supportedFeatures.supportNextTrack &&
    !supportedFeatures.supportPreviousTrack &&
    !supportedFeatures.supportsShuffle &&
    !supportedFeatures.supportsStop &&
    !supportedFeatures.supportsRepeat;

  // Determine if the player is on
  const isOn = state !== "off" && state !== "unavailable";
  const hasValidArt = Boolean(isOn && artImage?.src && !artError);

  const hasGroupingFeature = useMemo(() => {
    if (isEmbeddedInMultiCard) return false;
    if (config.media_players.length <= 1) return false;
    return true;
  }, [config, isEmbeddedInMultiCard]);

  const toggleGrouping = () => {
    setShowGrouping(!showGrouping);
  };

  const switchPlayer = () => {
    const currentIndex = config.media_players.findIndex(
      player => player.entity_id === selectedPlayer?.entity_id
    );
    setSelectedPlayer(
      config.media_players[(currentIndex + 1) % config.media_players.length]
    );
    setLastInteraction();
  };

  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const artAction: InteractionConfig = action ?? {
    tap_action: { action: "more-info" },
  };

  const artActionProps = useActionProps({
    rootElement,
    actionConfig: {
      ...artAction,
      entity: entity_id,
    },
    overrideCallback: tap_opens_popup
      ? {
          onTap: () => {
            setIsPopupVisible(true);
          },
        }
      : onClick
        ? { onTap: onClick }
        : undefined,
  });

  const togglePower = useCallback(() => {
    getHass().callService("media_player", "toggle", {
      entity_id,
    });
  }, [entity_id]);

  if (hideWhenOff && !isOn) {
    return null;
  }
  if (hideWhenGroupChild && isGroupChild) {
    return null;
  }

  return (
    <ha-card
      style={{
        "--ha-card-border-radius": "28px",
        ...(artVars ?? {}),
        ...(haVars && use_art_colors ? haVars : {}),
      }}
    >
      <div
        css={[styles.card, use_art_colors && styles.artBackground]}
        onClick={setLastInteraction}
      >
        <div
          css={[
            styles.cardContent,
            !isOn && styles.cardContentOff,
            hasValidArt && styles.cardContentWithArt,
            ((showGrouping && hasGroupingFeature) ||
              showCustomButtons ||
              showSearch ||
              showMediaBrowser ||
              showQueue) &&
              styles.cardContentExpanded,
          ]}
          onClick={!isOn ? togglePower : undefined}
        >
          {hasValidArt && artImage?.src && (
            <Fragment>
              <img
                css={[styles.bgArtImage, artLoaded && styles.bgArtImageLoaded]}
                src={artImage.src}
                alt=""
              />
              <div css={styles.bgArtScrim} />
            </Fragment>
          )}

          {!isOn ? (
            <Fragment>
              <div css={styles.leftSection}>
                <div css={styles.offBadge}>
                  <Icon icon="mdi:volume-off" size="x-small" />
                </div>
                <div css={styles.metaButton}>
                  <MetaInfo />
                </div>
              </div>
              <div css={styles.rightSection} onClick={e => e.stopPropagation()}>
                {!isEmbeddedInMultiCard &&
                  config.size === "compact" &&
                  config.options?.show_player_switch_button &&
                  config.media_players.length > 1 && (
                    <IconButton
                      id="mmpc-compact-switch-player"
                      css={styles.frostedSubtleBtn}
                      style={{ "--mmpc-icon-button-size": "17px" }}
                      size="x-small"
                      icon="mdi:swap-horizontal"
                      title="Show next media player"
                      aria-label="Show next media player"
                      onClick={switchPlayer}
                    />
                  )}
                {alwaysShowPowerButton && (
                  <IconButton
                    id="mmpc-compact-power-button"
                    css={styles.frostedActionBtn}
                    style={{ "--mmpc-icon-button-size": "18px" }}
                    size="x-small"
                    onClick={togglePower}
                    icon={"mdi:power"}
                  />
                )}
              </div>
            </Fragment>
          ) : showVolumeSlider || hasNoPlaybackControls ? (
            <VolumeSlider
              onClose={
                !hasNoPlaybackControls
                  ? () => setShowVolumeSlider(false)
                  : undefined
              }
              onToggleGrouping={hasGroupingFeature ? toggleGrouping : undefined}
              extraGroupCount={extraGroupCount}
            />
          ) : (
            <Fragment>
              <div css={styles.leftSection}>
                {!hasValidArt && (
                  <div css={styles.onBadge}>
                    <Icon
                      icon={
                        !source
                          ? getDeviceIcon({ icon, deviceClass })
                          : getSourceIcon({ source })
                      }
                      size="x-small"
                    />
                  </div>
                )}
                <button
                  css={[
                    styles.metaButton,
                    hasValidArt && styles.metaButtonWithArt,
                  ]}
                  {...artActionProps}
                >
                  <MetaInfo />
                  {artActionProps.renderLongPressIndicator()}
                </button>
              </div>

              <div css={styles.rightSection}>
                <div css={styles.controlsContainer}>
                  <PlaybackControls />
                </div>
                <VolumeTrigger
                  sliderVisible={showVolumeSlider}
                  setSliderVisible={setShowVolumeSlider}
                />
                {hasGroupingFeature && (
                  <div css={styles.groupBtnWrapper}>
                    <IconButton
                      id="mmpc-compact-grouping-toggle"
                      css={[
                        styles.frostedActionBtn,
                        showGrouping && styles.frostedActionBtnActive,
                      ]}
                      style={{ "--mmpc-icon-button-size": "18px" }}
                      size="x-small"
                      onClick={toggleGrouping}
                      icon={"mdi:speaker-multiple"}
                    />
                    {extraGroupCount > 0 && (
                      <span css={styles.groupBadge}>+{extraGroupCount}</span>
                    )}
                  </div>
                )}
                {!isEmbeddedInMultiCard &&
                  config.size === "compact" &&
                  config.options?.show_player_switch_button &&
                  config.media_players.length > 1 && (
                    <IconButton
                      id="mmpc-compact-switch-player"
                      css={styles.frostedSubtleBtn}
                      style={{ "--mmpc-icon-button-size": "17px" }}
                      size="x-small"
                      icon="mdi:swap-horizontal"
                      title="Show next media player"
                      aria-label="Show next media player"
                      onClick={switchPlayer}
                    />
                  )}
                {hasCustomButtons && !alwaysShowCustomButtons && (
                  <Fragment>
                    {custom_buttons.length === 1 ? (
                      <CustomButton
                        button={custom_buttons[0]}
                        type="icon-button"
                      />
                    ) : (
                      <IconButton
                        id="mmpc-compact-custom-buttons-toggle"
                        css={styles.frostedSubtleBtn}
                        style={{ "--mmpc-icon-button-size": "17px" }}
                        size="x-small"
                        onClick={() => setShowCustomButtons(!showCustomButtons)}
                        icon={"mdi:dots-horizontal"}
                      />
                    )}
                  </Fragment>
                )}
                {hasMediaBrowser && (
                  <IconButton
                    id="mmpc-compact-media-browser-toggle"
                    css={styles.frostedSubtleBtn}
                    style={{ "--mmpc-icon-button-size": "17px" }}
                    size="x-small"
                    onClick={() => setShowMediaBrowser(!showMediaBrowser)}
                    icon={"mdi:folder-music"}
                  />
                )}
                {hasSearch && (
                  <IconButton
                    id="mmpc-compact-search-toggle"
                    css={styles.frostedSubtleBtn}
                    style={{ "--mmpc-icon-button-size": "17px" }}
                    size="x-small"
                    onClick={() => setShowSearch(!showSearch)}
                    icon={"mdi:magnify"}
                  />
                )}
                {hasQueue && (
                  <IconButton
                    id="mmpc-compact-queue-toggle"
                    css={styles.frostedSubtleBtn}
                    style={{ "--mmpc-icon-button-size": "17px" }}
                    size="x-small"
                    onClick={() => setShowQueue(!showQueue)}
                    icon={"mdi:playlist-music"}
                  />
                )}
                {!isEmbeddedInMultiCard && (
                  <AdditionalActionsMenu
                    ma_entity_id={ma_entity_id ?? undefined}
                    ma_favorite_button_entity_id={
                      ma_favorite_button_entity_id ?? undefined
                    }
                    lms_entity_id={lms_entity_id ?? undefined}
                    noSourceSelection={showSourceSelection === false}
                    renderTrigger={triggerProps => (
                      <IconButton
                        id="mmpc-compact-additional-actions-trigger"
                        css={styles.frostedSubtleBtn}
                        style={{ "--mmpc-icon-button-size": "17px" }}
                        icon={"mdi:dots-vertical"}
                        size="x-small"
                        {...triggerProps}
                      />
                    )}
                  />
                )}
                {alwaysShowPowerButton && (
                  <IconButton
                    id="mmpc-compact-power-button"
                    css={styles.frostedActionBtn}
                    style={{ "--mmpc-icon-button-size": "18px" }}
                    size="x-small"
                    onClick={togglePower}
                    icon={"mdi:power"}
                  />
                )}
              </div>
            </Fragment>
          )}
        </div>

        {showGrouping && hasGroupingFeature && <SpeakerGrouping />}
        {showCustomButtons && <CustomButtons />}
        {showSearch && <Search />}
        {showMediaBrowser && <MediaBrowserBar />}
        {showQueue && <QueueView />}
        {isPopupVisible && (
          <MassivePopUp
            visible={isPopupVisible}
            setVisible={setIsPopupVisible}
          />
        )}
      </div>
    </ha-card>
  );
};
