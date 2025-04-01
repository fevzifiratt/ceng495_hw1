// app/models/User.ts
import { ObjectId } from 'mongodb';

// Define interface for item reviews
export interface ItemReview {
  itemId: ObjectId;
  rating: number;
  comment?: string;
}

// Define user interface
export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
  averageRating: number;
  itemReviews: ItemReview[];
  reviewCount: number;
}

// User without password for safe returns
export type UserWithoutPassword = Omit<User, 'password'>;
