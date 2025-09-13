export interface CatchLog {
  id: string;
  imageUrl: string;
  date: string; // YYYY-MM-DD
  location: string;
  size?: string; // e.g., "35cm"
  angler: string;
  notes?: string;
  dishImageUrl?: string;
  tasteRating?: number; // 1 to 5
  dishNotes?: string;
}

export interface Fish {
  id: number;
  name: string;
  description: string;
  habitat: string;
  defaultImageUrl: string;
  catches: CatchLog[];
  isPoisonous?: boolean;
  coverImageCatchId?: string;
}