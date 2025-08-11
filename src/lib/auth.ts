"use client";

import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  AuthError,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  query,
  where,
  getDocs,
  collection
} from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from './firebase';

// User roles enum
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

// Extended user interface
export interface ExtendedUser extends User {
  role?: UserRole;
  churchName?: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  isActive?: boolean;
}

// Authentication result interface
export interface AuthResult {
  user: ExtendedUser | null;
  isNewUser: boolean;
  error?: string;
}

// Rate limiting for auth attempts
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_AUTH_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

class AuthService {
  // Rate limiting helper
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const attempts = authAttempts.get(identifier);
    
    if (!attempts) {
      authAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
      authAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if rate limited
    if (attempts.count >= MAX_AUTH_ATTEMPTS) {
      return false;
    }
    
    // Increment attempts
    attempts.count++;
    attempts.lastAttempt = now;
    return true;
  }

  // Create or update user profile in Firestore
  private async createUserProfile(user: User, additionalData: any = {}): Promise<ExtendedUser> {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      name: user.displayName || additionalData.name || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: UserRole.USER,
      emailVerified: user.emailVerified,
      lastLoginAt: serverTimestamp(),
      isActive: true,
      ...additionalData
    };
    
    if (!userDoc.exists()) {
      // New user
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        loginCount: 1,
      });
    } else {
      // Existing user - update login info
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        loginCount: increment(1),
        isActive: true,
      });
    }
    
    return { ...user, ...userData } as ExtendedUser;
  }

  // Google OAuth login
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      if (!this.checkRateLimit('google-signin')) {
        return { user: null, isNewUser: false, error: 'Too many attempts. Please try again later.' };
      }

      const result = await signInWithPopup(auth, googleProvider);
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      const extendedUser = await this.createUserProfile(result.user, {
        authProvider: 'google'
      });
      
      return { user: extendedUser, isNewUser };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { user: null, isNewUser: false, error: this.getErrorMessage(error) };
    }
  }

  // Facebook OAuth login
  async signInWithFacebook(): Promise<AuthResult> {
    try {
      if (!this.checkRateLimit('facebook-signin')) {
        return { user: null, isNewUser: false, error: 'Too many attempts. Please try again later.' };
      }

      const result = await signInWithPopup(auth, facebookProvider);
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      const extendedUser = await this.createUserProfile(result.user, {
        authProvider: 'facebook'
      });
      
      return { user: extendedUser, isNewUser };
    } catch (error: any) {
      console.error('Facebook sign-in error:', error);
      return { user: null, isNewUser: false, error: this.getErrorMessage(error) };
    }
  }

  // Email/password sign in
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      if (!this.checkRateLimit(email)) {
        return { user: null, isNewUser: false, error: 'Too many attempts. Please try again later.' };
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const extendedUser = await this.createUserProfile(result.user, {
        authProvider: 'email'
      });
      
      return { user: extendedUser, isNewUser: false };
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      return { user: null, isNewUser: false, error: this.getErrorMessage(error) };
    }
  }

  // Email/password sign up
  async signUpWithEmail(email: string, password: string, name: string, churchName?: string): Promise<AuthResult> {
    try {
      if (!this.checkRateLimit(email)) {
        return { user: null, isNewUser: false, error: 'Too many attempts. Please try again later.' };
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(result.user, { displayName: name });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      const extendedUser = await this.createUserProfile(result.user, {
        name,
        churchName: churchName || '',
        authProvider: 'email'
      });
      
      return { user: extendedUser, isNewUser: true };
    } catch (error: any) {
      console.error('Email sign-up error:', error);
      return { user: null, isNewUser: false, error: this.getErrorMessage(error) };
    }
  }

  // Sign out
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Send password reset email
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Update password
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'No authenticated user found' };
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return { success: true };
    } catch (error: any) {
      console.error('Password update error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get user role and permissions
  async getUserRole(userId: string): Promise<UserRole> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().role || UserRole.USER;
      }
      return UserRole.USER;
    } catch (error) {
      console.error('Error getting user role:', error);
      return UserRole.USER;
    }
  }

  // Check if user has permission
  hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.USER]: 0,
      [UserRole.MODERATOR]: 1,
      [UserRole.ADMIN]: 2
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, newRole: UserRole, adminUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const adminRole = await this.getUserRole(adminUserId);
      if (!this.hasPermission(adminRole, UserRole.ADMIN)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId
      });

      return { success: true };
    } catch (error: any) {
      console.error('Role update error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Ban/unban user (moderator+)
  async updateUserStatus(userId: string, isActive: boolean, moderatorUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const moderatorRole = await this.getUserRole(moderatorUserId);
      if (!this.hasPermission(moderatorRole, UserRole.MODERATOR)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      await updateDoc(doc(db, 'users', userId), {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: moderatorUserId
      });

      return { success: true };
    } catch (error: any) {
      console.error('User status update error:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get all users (admin only)
  async getAllUsers(adminUserId: string): Promise<{ users: any[]; error?: string }> {
    try {
      const adminRole = await this.getUserRole(adminUserId);
      if (!this.hasPermission(adminRole, UserRole.ADMIN)) {
        return { users: [], error: 'Insufficient permissions' };
      }

      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { users };
    } catch (error: any) {
      console.error('Get users error:', error);
      return { users: [], error: this.getErrorMessage(error) };
    }
  }

  // Error message helper
  private getErrorMessage(error: AuthError | any): string {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked. Please allow pop-ups and try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
}

export const authService = new AuthService();
export default authService;
