export interface MediaItem {
    id: string;
    type: 'image' | 'video';
    uri: string;
    thumbnail?: string; // For videos
    aspectRatio?: number; // 1: 1:1, 0.8: 4:5, 1.91: Landscape, 0: Original/Auto
    resizeMode?: 'cover' | 'contain';
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: Date;
    likes: number;
}

export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    media: MediaItem[];
    timestamp: Date;
    likes: number;
    likedByUser: boolean;
    comments: Comment[];
    commentCount: number;
    views: number;
    category: 'feed' | 'trending' | 'following';
    location?: string;
    vehicleInfo?: string;
    tags?: string[];
    isVerified?: boolean;
}

export interface CreatePostInput {
    content: string;
    media: MediaItem[];
    location?: string;
    tags?: string[];
}
