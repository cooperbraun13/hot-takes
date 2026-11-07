export type MediaType = "movie" | "tv" | "book" | "music" |"game" | "podcast";

export interface Media {
    id: string;
    media_type: MediaType;
    external_source: string;
    external_id: string;
    title: string;
    year: number | null;
    cover_url: string | null;
    description: string;
    extra?: Record<string, unknown>;
}

export interface Take {
    id: string;
    media: Media;
    rating: number;
    created_at: string;
}

export interface MediaCategory {
    id: string;
    name: string;
    icon: string;
    path: string;
    available: boolean;
}

