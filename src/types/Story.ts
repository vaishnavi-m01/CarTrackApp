export interface Story {
    id: string;
    userId: string | number;
    userName: string;
    userAvatar?: string;
    mediaUri: string;
    mediaType: 'image' | 'video';
    caption?: string;
    captionPosition?: { x: number; y: number };
    captionStyle?: {
        fontSize?: number;
        fontFamily?: string;
        color?: string;
        backgroundColor?: string;
    };
    timestamp: number;
    expiresAt: number;
    viewed?: boolean;
    likesCount?: number;
    viewsCount?: number;
    isLiked?: boolean;
    isLikedFetched?: boolean;
    replies?: {
        id: string;
        userId: string | number;
        userName: string;
        content: string;
        timestamp: number;
    }[];
}

export interface StoryGroup {
    userId: string | number;
    userName: string;
    userAvatar?: string;
    stories: Story[];
    hasUnviewed: boolean;
    isFollowing?: boolean;
    isPrivate?: boolean;
    followStatus?: 'PENDING' | 'ACCEPTED' | null;
}
