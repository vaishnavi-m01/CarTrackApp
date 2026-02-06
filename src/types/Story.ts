export interface Story {
    id: string;
    userId: string;
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
}

export interface StoryGroup {
    userId: string;
    userName: string;
    userAvatar?: string;
    stories: Story[];
    hasUnviewed: boolean;
}
