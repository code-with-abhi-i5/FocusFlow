export type ProductivityCategory = 'productive' | 'unproductive' | 'neutral';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL: string;
  createdAt: any; // Firestore Timestamp
}

export interface TimeEntry {
  uid: string;
  domain: string;
  category: ProductivityCategory;
  timeSpent: number; // in milliseconds
  date: string; // YYYY-MM-DD
  timestamp: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Goal {
  uid: string;
  dailyProductiveHours: number; // in hours
  socialMediaLimit: number; // in minutes
  updatedAt: any; // Firestore Timestamp
}

export interface Streak {
  uid: string;
  currentStreak: number;
  bestStreak: number;
  lastProductiveDate: string | null; // YYYY-MM-DD
  updatedAt: any; // Firestore Timestamp
}

export interface CustomCategories {
  uid: string;
  productive: string[];
  unproductive: string[];
  neutral: string[];
  updatedAt: any; // Firestore Timestamp
}

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}
