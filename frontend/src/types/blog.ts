export interface Blog {
  id: string;
  title: string;
  slug: string;
  disc: string;
  content: string;
  imageUrl: string | null;
  publish: boolean;
  creatorId: string;
  creatorUsername: string;
  creatorProfileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByCurrentUser: boolean;
}

export interface BlogPage {
  content: Blog[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
