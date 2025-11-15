export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}
