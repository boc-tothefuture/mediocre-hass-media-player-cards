import { getMediocreLegacyConfigToMediocreMultiConfig } from "./getMediocreLegacyConfigToMultiConfig";
import { MediocreMediaPlayerCardConfig } from "@types";

describe("getMediocreLegacyConfigToMediocreMultiConfig", () => {
  const baseConfig: MediocreMediaPlayerCardConfig = {
    type: "custom:mediocre-media-player-card",
    entity_id: "media_player.living_room",
    name: "Living Room",
    use_art_colors: true,
    tap_opens_popup: true,
    action: { tap_action: { action: "toggle" } },
    ma_entity_id: "ma.living_room",
    ma_favorite_button_entity_id: "ma_fav.living_room",
    lms_entity_id: "lms.living_room",
    search: [
      { entity_id: "media_player.living_room", name: "Search Living Room" },
    ],
    media_browser: [
      { entity_id: "media_player.living_room", name: "Living Room Browser" },
    ],
    custom_buttons: [
      {
        icon: "mdi:play",
        name: "Play",
        tap_action: {
          action: "perform-action",
          perform_action: "media_play",
          target: {},
        },
      },
    ],
    speaker_group: {
      entity_id: "media_player.living_room_group",
      entities: [
        { entity: "media_player.kitchen", name: "Kitchen" },
        "media_player.bedroom",
      ],
    },
    options: {
      show_volume_step_buttons: true,
      use_volume_up_down_for_step_buttons: false,
      always_show_custom_buttons: true,
      always_show_power_button: false,
      hide_when_group_child: false,
      hide_when_off: false,
    },
  };

  it("should convert legacy config to multi config with all fields", () => {
    const result = getMediocreLegacyConfigToMediocreMultiConfig(baseConfig);
    expect(result).toEqual(
      expect.objectContaining({
        type: "custom:mediocre-multi-media-player-card",
        use_art_colors: true,
        disable_player_focus_switching: true,
        entity_id: "media_player.living_room",
        tap_opens_popup: true,
        size: "compact",
        options: expect.objectContaining({
          show_volume_step_buttons: true,
          use_volume_up_down_for_step_buttons: false,
          always_show_custom_buttons: true,
          always_show_power_button: false,
          hide_when_group_child: false,
          hide_when_off: false,
          show_player_name: true,
          show_source_selection: true,
        }),
        media_players: [
          expect.objectContaining({
            action: { tap_action: { action: "toggle" } },
            entity_id: "media_player.living_room",
            ma_entity_id: "ma.living_room",
            ma_favorite_button_entity_id: "ma_fav.living_room",
            speaker_group_entity_id: "media_player.living_room_group",
            lms_entity_id: "lms.living_room",
            search: [
              {
                entity_id: "media_player.living_room",
                name: "Search Living Room",
              },
            ],
            media_browser: [
              {
                entity_id: "media_player.living_room",
                name: "Living Room Browser",
              },
            ],
            custom_buttons: [
              {
                icon: "mdi:play",
                name: "Play",
                tap_action: {
                  action: "perform-action",
                  perform_action: "media_play",
                  target: {},
                },
              },
            ],
            can_be_grouped: true,
          }),
          expect.objectContaining({
            entity_id: "media_player.kitchen",
            name: "Kitchen",
            can_be_grouped: true,
          }),
          expect.objectContaining({
            entity_id: "media_player.bedroom",
            can_be_grouped: true,
          }),
        ],
      })
    );
  });

  it("should handle missing speaker_group and options", () => {
    const config = {
      ...baseConfig,
      speaker_group: undefined,
      options: undefined,
    };
    const result = getMediocreLegacyConfigToMediocreMultiConfig(config);
    expect(result.media_players.length).toBe(1);
    expect(result.options).toEqual({
      show_volume_step_buttons: false,
      use_volume_up_down_for_step_buttons: false,
      use_experimental_lms_media_browser: false,
      always_show_custom_buttons: false,
      always_show_power_button: false,
      hide_when_group_child: false,
      hide_when_off: false,
      show_player_name: true,
      show_source_selection: true,
    });
  });

  it("should handle explicit false for show_player_name and show_source_selection", () => {
    const config = {
      ...baseConfig,
      options: {
        ...baseConfig.options,
        show_player_name: false,
        show_source_selection: false,
      },
    };
    const result = getMediocreLegacyConfigToMediocreMultiConfig(config);
    expect(result.options).toEqual(
      expect.objectContaining({
        show_player_name: false,
        show_source_selection: false,
      })
    );
  });

  it("should handle speaker_group with only string entities", () => {
    const config = {
      ...baseConfig,
      speaker_group: {
        entity_id: "media_player.living_room_group",
        entities: ["media_player.kitchen", "media_player.bedroom"],
      },
    };
    const result = getMediocreLegacyConfigToMediocreMultiConfig(config);
    expect(result.media_players[1]).toEqual(
      expect.objectContaining({
        entity_id: "media_player.kitchen",
        can_be_grouped: true,
      })
    );
    expect(result.media_players[2]).toEqual(
      expect.objectContaining({
        entity_id: "media_player.bedroom",
        can_be_grouped: true,
      })
    );
  });

  it("should handle speaker_group with only object entities", () => {
    const config = {
      ...baseConfig,
      speaker_group: {
        entity_id: "media_player.living_room_group",
        entities: [
          { entity: "media_player.kitchen", name: "Kitchen" },
          { entity: "media_player.bedroom", name: "Bedroom" },
        ],
      },
    };
    const result = getMediocreLegacyConfigToMediocreMultiConfig(config);
    expect(result.media_players[1]).toEqual(
      expect.objectContaining({
        entity_id: "media_player.kitchen",
        name: "Kitchen",
        can_be_grouped: true,
      })
    );
    expect(result.media_players[2]).toEqual(
      expect.objectContaining({
        entity_id: "media_player.bedroom",
        name: "Bedroom",
        can_be_grouped: true,
      })
    );
  });

  it("should pass self_entity_id, join_service, and unjoin_service, skipping self_entity_id from group entities", () => {
    const config: MediocreMediaPlayerCardConfig = {
      ...baseConfig,
      entity_id: "media_player.kitchen_stream",
      speaker_group: {
        entity_id: "sensor.kitchen_stream_group",
        self_entity_id: "media_player.kitchen",
        join_service: "script.music_zone_group_join",
        unjoin_service: "script.music_zone_group_unjoin",
        entities: [
          "media_player.kitchen",
          "media_player.brians_office",
          "media_player.covered_deck",
        ],
      },
    };
    const result = getMediocreLegacyConfigToMediocreMultiConfig(config);
    expect(result.media_players[0]).toEqual(
      expect.objectContaining({
        entity_id: "media_player.kitchen_stream",
        speaker_group_entity_id: "sensor.kitchen_stream_group",
        speaker_group_self_entity_id: "media_player.kitchen",
        speaker_group_join_service: "script.music_zone_group_join",
        speaker_group_unjoin_service: "script.music_zone_group_unjoin",
      })
    );
    // media_player.kitchen should be skipped from group entities
    const groupEntities = result.media_players.slice(1).map(p => p.entity_id);
    expect(groupEntities).toEqual([
      "media_player.brians_office",
      "media_player.covered_deck",
    ]);
  });
});
