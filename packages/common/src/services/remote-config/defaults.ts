import { IntKeys, StringKeys, DoubleKeys, BooleanKeys } from './types'

const ETH_PROVIDER_URLS = process.env.REACT_APP_ETH_PROVIDER_URL || ''
const DEFAULT_ENTRY_TTL = 1 /* min */ * 60 /* seconds */ * 1000 /* ms */
const DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS = 5_000

export const remoteConfigIntDefaults: { [key in IntKeys]: number | null } = {
  [IntKeys.IMAGE_QUICK_FETCH_TIMEOUT_MS]: 5000,
  [IntKeys.IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE]: 20,
  [IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS]: 10 * 60 * 1000,
  [IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS]: null,
  [IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF]: null,
  [IntKeys.DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS]: 5000,
  [IntKeys.NOTIFICATION_POLLING_FREQ_MS]: 60 * 1000,
  [IntKeys.SERVICE_MONITOR_HEALTH_CHECK_SAMPLE_RATE]: 0,
  [IntKeys.SERVICE_MONITOR_REQUEST_SAMPLE_RATE]: 0,
  [IntKeys.INSTAGRAM_HANDLE_CHECK_TIMEOUT]: 4000,
  [IntKeys.AUTOPLAY_LIMIT]: 10,
  [IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_TIMEOUT]: 30000,
  [IntKeys.DISCOVERY_NODE_SELECTION_REQUEST_RETRIES]: 5,
  [IntKeys.ATTESTATION_QUORUM_SIZE]: 0,
  [IntKeys.MIN_AUDIO_SEND_AMOUNT]: 5,
  [IntKeys.CHALLENGE_REFRESH_INTERVAL_MS]: 15000,
  [IntKeys.CHALLENGE_REFRESH_INTERVAL_AUDIO_PAGE_MS]: 5000,
  [IntKeys.MANUAL_CLAIM_PROMPT_DELAY_MS]: 15000,
  [IntKeys.MAX_CLAIM_RETRIES]: 5,
  [IntKeys.CLIENT_ATTESTATION_PARALLELIZATION]: 20,
  [IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_FREQUENCY_MS]: 1000,
  [IntKeys.CHALLENGE_CLAIM_COMPLETION_POLL_TIMEOUT_MS]: 10000,
  [IntKeys.MIN_AUDIO_PURCHASE_AMOUNT]: 5,
  [IntKeys.MAX_AUDIO_PURCHASE_AMOUNT]: 999,
  [IntKeys.BUY_TOKEN_WALLET_POLL_DELAY_MS]: 1000,
  [IntKeys.BUY_TOKEN_WALLET_POLL_MAX_RETRIES]: 120,
  [IntKeys.BUY_AUDIO_SLIPPAGE]: 3,
  [IntKeys.GATED_TRACK_POLL_INTERVAL_MS]: 1000,
  [IntKeys.DISCOVERY_NOTIFICATIONS_GENESIS_UNIX_TIMESTAMP]: 0,
  [IntKeys.CACHE_ENTRY_TTL]: DEFAULT_ENTRY_TTL,
  [IntKeys.HANDLE_VERIFICATION_TIMEOUT_MILLIS]:
    DEFAULT_HANDLE_VERIFICATION_TIMEOUT_MILLIS
}

export const remoteConfigStringDefaults: {
  [key in StringKeys]: string | null
} = {
  [StringKeys.AUDIUS_LOGO_VARIANT]: null,
  [StringKeys.AUDIUS_LOGO_VARIANT_CLICK_TARGET]: null,
  [StringKeys.APP_WIDE_NOTICE_TEXT]: null,
  [StringKeys.ETH_PROVIDER_URLS]: ETH_PROVIDER_URLS,
  [StringKeys.CONTENT_BLOCK_LIST]: null,
  [StringKeys.CONTENT_NODE_BLOCK_LIST]: null,
  [StringKeys.DISCOVERY_NODE_BLOCK_LIST]: null,
  [StringKeys.INSTAGRAM_API_PROFILE_URL]:
    'https://instagram.com/$USERNAME$/?__a=1',
  // Audius user id
  [StringKeys.TRENDING_PLAYLIST_OMITTED_USER_IDS]: '51',
  [StringKeys.TRENDING_REWARD_IDS]:
    'trending-track,trending-playlist,trending-underground,top-api',
  [StringKeys.CHALLENGE_REWARD_IDS]:
    'track-upload,invite-friends,mobile-app,connect-verified,listen-streak,profile-completion,send-first-tip,first-playlist',
  [StringKeys.REWARDS_TWEET_ID_TRACKS]: '1374856377651187713',
  [StringKeys.REWARDS_TWEET_ID_PLAYLISTS]: '1374856377651187713',
  [StringKeys.REWARDS_TWEET_ID_UNDERGROUND]: '1374856377651187713',
  [StringKeys.TF]: null,
  [StringKeys.TPF]: null,
  [StringKeys.UTF]: null,
  [StringKeys.TRENDING_EXPERIMENT]: null,
  [StringKeys.PLAYLIST_TRENDING_EXPERIMENT]: null,
  [StringKeys.UNDERGROUND_TRENDING_EXPERIMENT]: null,
  [StringKeys.ORACLE_ETH_ADDRESS]: null,
  [StringKeys.ORACLE_ENDPOINT]: null,
  [StringKeys.REWARDS_ATTESTATION_ENDPOINTS]: null,
  [StringKeys.MIN_APP_VERSION]: '1.0.0',
  [StringKeys.BUY_AUDIO_PRESET_AMOUNTS]: '5,10,25,50,100',
  [StringKeys.COINBASE_PAY_ALLOWED_COUNTRIES]: '',
  [StringKeys.COINBASE_PAY_DENIED_REGIONS]: '',
  [StringKeys.STRIPE_ALLOWED_COUNTRIES]: '',
  [StringKeys.STRIPE_DENIED_REGIONS]: '',
  [StringKeys.COINBASE_PAY_ALLOWED_COUNTRIES_2_LETTER]: '',
  [StringKeys.STRIPE_ALLOWED_COUNTRIES_2_LETTER]: '',
  [StringKeys.AUDIO_FEATURES_DEGRADED_TEXT]: null,
  [StringKeys.PAY_EXTRA_PRESET_CENT_AMOUNTS]: '100,500,1000'
}

export const remoteConfigDoubleDefaults: {
  [key in DoubleKeys]: number | null
} = {
  [DoubleKeys.SHOW_ARTIST_RECOMMENDATIONS_FALLBACK_PERCENT]: 0.3333,
  [DoubleKeys.SHOW_ARTIST_RECOMMENDATIONS_PERCENT]: 1.0
}
export const remoteConfigBooleanDefaults: {
  [key in BooleanKeys]: boolean | null
} = {
  [BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION]: true,
  [BooleanKeys.DISPLAY_INSTAGRAM_VERIFICATION_WEB_AND_DESKTOP]: true,
  [BooleanKeys.DISPLAY_TWITTER_VERIFICATION]: true,
  [BooleanKeys.DISPLAY_TWITTER_VERIFICATION_WEB_AND_DESKTOP]: true,
  [BooleanKeys.DISPLAY_TIKTOK_VERIFICATION]: true,
  [BooleanKeys.DISPLAY_TIKTOK_VERIFICATION_WEB_AND_DESKTOP]: true,
  [BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_CONNECT]: true,
  [BooleanKeys.DISPLAY_WEB3_PROVIDER_BITSKI]: true,
  [BooleanKeys.DISPLAY_WEB3_PROVIDER_WALLET_LINK]: true,
  [BooleanKeys.DISPLAY_SOLANA_WEB3_PROVIDER_PHANTOM]: true,
  [BooleanKeys.SKIP_ROLLOVER_NODES_SANITY_CHECK]: false,
  [BooleanKeys.USE_AMPLITUDE]: true,
  [BooleanKeys.AUDIO_TRANSACTIONS_ENABLED]: false,
  [BooleanKeys.ENABLE_DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS]: false
}
