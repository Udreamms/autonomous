// src/types/message.ts

/**
 * Platform Types
 * Supported channels for the Omnichannel Hub
 */
export type PlatformType =
    | 'whatsapp'
    | 'instagram'
    | 'messenger'
    | 'telegram'
    | 'web'
    | 'x'        // Twitter
    | 'tiktok'
    | 'snapchat'
    | 'sms';

/**
 * Message Content Types
 */
export type MessageType =
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'location'
    | 'interactive' // Buttons, lists, native platform widgets
    | 'sticker'
    | 'voice'
    | 'post_mention' // For X, Instagram mentions
    | 'comment';     // For Facebook, Instagram, X replies

/**
 * Platform Metadata
 * Stores channel-specific user details that don't fit in the standard fields
 */
export interface PlatformMetadata {
    profile_picture?: string;
    username?: string;            // @username for X, Instagram, Telegram, TikTok
    platform_user_id?: string;    // Original ID from the platform
    is_verified?: boolean;        // For X, Instagram
    followers_count?: number;     // Context for priority?
    reply_to_id?: string;         // ID of the post/comment being replied to
    thread_id?: string;           // For email or threaded conversations
    chat_id?: string | number;    // For Telegram/Bot chats
    platform_specific_data?: Record<string, any>; // Raw dump if needed
}

/**
 * Universal Message Interface
 * The "Esperanto" of our system. All webhooks must convert to this format.
 */
export interface UnifiedMessage {
    // SOURCE IDENTIFICATION
    source_platform: PlatformType;

    // USER IDENTIFICATION
    external_id: string;          // Unique ID on the platform (phone number, user_id, etc.)
    contact_name: string;          // Display name (or username if name unknown)

    // MESSAGE CONTENT
    message_text: string;          // Normalized text content
    message_type: MessageType;     // Categorized type
    timestamp: Date;               // When it was sent (not received)

    // METADATA
    platform_metadata?: PlatformMetadata;

    // MEDIA (Unified)
    media_url?: string;            // Direct URL to content
    media_caption?: string;        // Caption attached to media
    media_mime_type?: string;      // 'image/jpeg', 'video/mp4', etc.
    media_duration?: number;       // In seconds (audio/video)

    // INTERACTIVE / SYSTEM
    interactive_data?: {
        button_id?: string;
        list_id?: string;
        quick_reply?: string;
        command?: string;           // E.g. '/start' for bots
    };

    // LOCATION
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
        name?: string;
    };
}

// --- RAW PAYLOAD INTERFACES (For Type Safety in Normalizers) ---

// WhatsApp (Existing - for reference)
export interface WhatsAppRawMessage {
    from: string;
    type: string;
    timestamp: string;
    text?: { body: string };
    // ... other fields handled in existing implementation
}

// X (Twitter) - Simplified V2 Object
export interface XRawMessage {
    data: {
        id: string;
        text: string;
        author_id: string;
        created_at: string;
        referenced_tweets?: Array<{ type: string; id: string }>;
    };
    includes?: {
        users?: Array<{
            id: string;
            name: string;
            username: string;
            profile_image_url?: string;
            verified?: boolean;
        }>;
        media?: Array<{
            media_key: string;
            type: string;
            url?: string; // For images
            preview_image_url?: string; // For videos
        }>;
    };
}

// TikTok - Direct Message Webhook (Mock structure based on standard APIs)
export interface TikTokRawMessage {
    event_type: string;
    create_time: number;
    from_user_id: string;
    content: string; // JSON string usually
    message_type: 'text' | 'image' | 'sticker';
}

// Instagram / Messenger (Graph API)
export interface MetaRawMessage {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
            type: string;
            payload: { url: string };
        }>;
        is_echo?: boolean;
    };
    post_id?: string; // For comments
    comment_id?: string; // For comments
    item?: 'comment' | 'reaction';
    verb?: 'add' | 'remove';
}
