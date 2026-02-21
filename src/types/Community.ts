export interface MediaItem {
    id: string | number;
    postId?: number;
    mediaUrl?: string;
    uri?: string;
    type: 'image' | 'video';
    aspectRatio?: number;
    trimStart?: number;
    trimEnd?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Comment {
    id: string | number;
    userId: number;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string | Date;
    likes: number;
}

export interface CommunityPost {
    id: string | number;
    userId: number;
    userName: string;
    userAvatar?: string;
    user?: {
        id: number;
        username: string;
        profilePicUrl?: string;
    };
    content: string;
    media: MediaItem[];
    createdAt: string | Date;
    likes: number;
    likesCount?: number;
    likedByUser: boolean;
    comments: Comment[];
    commentCount: number;
    commentsCount?: number;
    views: number;
    viewsCount?: number;
    isSaved: boolean;
    savesCount?: number;
    sharesCount?: number;
    category?: 'feed' | 'trending' | 'following';
    location?: string;
    feeling?: string;
    allowComments: boolean;
    isPublic: boolean;
    vehicleId?: number;
    isVerified?: boolean;
    tags?: string | string[];
}

export interface CreatePostInput {
    id?: number;
    content: string;
    location?: string;
    feeling?: string;
    allowComments: boolean;
    isPublic: boolean;
    userId: number;
    vehicleId?: number;
    tags?: string;
}

export interface NewsCategory {
    id: number;
    name: string;
}

export interface NewsHighlight {
    id: number;
    categoryId: number;
    badgeText?: string;
    title: string;
    source?: string;
    description: string;
    isTrending: boolean;
}
