export type ChatMessage = {
    id: string;
    chatroom_id: number;
    content: string;
    type: string;
    created_at: string;
    sender: {
        id: number;
        username: string;
        slug: string;
        identity: {
            color: string;
            badges: any[];
        };
    };
};

export type ResponsiveBanner = {
    responsive: string;
    url: string;
};

export type CategoryDetails = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    tags: string[];
    description: string | null;
    deleted_at: string | null;
    viewers: number;
    banner: ResponsiveBanner;
    category: {
        id: number;
        name: string;
        slug: string;
        icon: string;
    };
};

export type User = {
    id: number;
    username: string;
    agreed_to_terms: boolean;
    email_verified_at: string;
    bio: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    instagram: string | null;
    twitter: string | null;
    youtube: string | null;
    discord: string | null;
    tiktok: string | null;
    facebook: string | null;
    profile_pic: string | null;
};

export type Chatroom = {
    id: number;
    chatable_type: string;
    channel_id: number;
    created_at: string;
    updated_at: string;
    chat_mode_old: string;
    chat_mode: string;
    slow_mode: boolean;
    chatable_id: number;
    followers_mode: boolean;
    subscribers_mode: boolean;
    emotes_mode: boolean;
    message_interval: number;
    following_min_duration: number;
};

export type Livestream = {
    id: number;
    slug: string;
    channel_id: number;
    created_at: string;
    session_title: string;
    is_live: boolean;
    risk_level_id: string | null;
    start_time: string;
    source: string | null;
    twitch_channel: string | null;
    duration: number;
    language: string;
    is_mature: boolean;
    viewer_count: number;
    thumbnail: {
        src: string;
        srcset: string;
    };
    views: number;
    tags: any[];
    categories: CategoryDetails[];
    video: {
        id: number;
        live_stream_id: number;
        slug: string | null;
        thumb: string | null;
        s3: string | null;
        trading_platform_id: string | null;
        created_at: string;
        updated_at: string;
        uuid: string;
        views: number;
        deleted_at: string | null;
    };
};

export type ChannelData = {
    id: number;
    user_id: number;
    slug: string;
    is_banned: boolean;
    playback_url: string;
    name_updated_at: string | null;
    vod_enabled: boolean;
    subscription_enabled: boolean;
    followersCount: number;
    subscriber_badges: any[];
    banner_image: string | null;
    recent_categories: CategoryDetails[];
    livestream: string | null;
    role: string;
    muted: boolean;
    follower_badges: any[];
    offline_banner_image: string | null;
    can_host: boolean;
    user: User;
    chatroom: Chatroom;
    ascending_links: any[];
    plan: string | null;
    previous_livestreams: Livestream[];
};
