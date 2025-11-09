export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  emoji: string | null;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}
