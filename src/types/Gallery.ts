import { MediaItem } from './Community';

export interface GalleryAlbum {
    id: string;
    title: string;
    media: MediaItem[];
    createdAt: string;
}
