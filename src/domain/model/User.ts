export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
