"use server";

import { UserRole } from './auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Define permissions
export enum Permission {
  // User permissions
  READ_PUBLIC_CONTENT = 'read_public_content',
  CREATE_LISTING = 'create_listing',
  UPDATE_OWN_LISTING = 'update_own_listing',
  DELETE_OWN_LISTING = 'delete_own_listing',
  SEND_MESSAGE = 'send_message',
  UPDATE_OWN_PROFILE = 'update_own_profile',
  
  // Moderator permissions
  MODERATE_CONTENT = 'moderate_content',
  DELETE_ANY_LISTING = 'delete_any_listing',
  BAN_USER = 'ban_user',
  VIEW_REPORTS = 'view_reports',
  RESOLVE_REPORTS = 'resolve_reports',
  
  // Admin permissions
  MANAGE_USERS = 'manage_users',
  ASSIGN_ROLES = 'assign_roles',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  EXPORT_DATA = 'export_data',
}

// Role-permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_PUBLIC_CONTENT,
    Permission.CREATE_LISTING,
    Permission.UPDATE_OWN_LISTING,
    Permission.DELETE_OWN_LISTING,
    Permission.SEND_MESSAGE,
    Permission.UPDATE_OWN_PROFILE,
  ],
  
  [UserRole.MODERATOR]: [
    // All user permissions
    ...ROLE_PERMISSIONS[UserRole.USER] || [],
    // Plus moderator permissions
    Permission.MODERATE_CONTENT,
    Permission.DELETE_ANY_LISTING,
    Permission.BAN_USER,
    Permission.VIEW_REPORTS,
    Permission.RESOLVE_REPORTS,
  ],
  
  [UserRole.ADMIN]: [
    // All moderator permissions
    ...ROLE_PERMISSIONS[UserRole.MODERATOR] || [],
    // Plus admin permissions
    Permission.MANAGE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SYSTEM,
    Permission.EXPORT_DATA,
  ],
};

// Fix the circular reference
ROLE_PERMISSIONS[UserRole.MODERATOR] = [
  Permission.READ_PUBLIC_CONTENT,
  Permission.CREATE_LISTING,
  Permission.UPDATE_OWN_LISTING,
  Permission.DELETE_OWN_LISTING,
  Permission.SEND_MESSAGE,
  Permission.UPDATE_OWN_PROFILE,
  Permission.MODERATE_CONTENT,
  Permission.DELETE_ANY_LISTING,
  Permission.BAN_USER,
  Permission.VIEW_REPORTS,
  Permission.RESOLVE_REPORTS,
];

ROLE_PERMISSIONS[UserRole.ADMIN] = [
  ...ROLE_PERMISSIONS[UserRole.MODERATOR],
  Permission.MANAGE_USERS,
  Permission.ASSIGN_ROLES,
  Permission.VIEW_ANALYTICS,
  Permission.MANAGE_SYSTEM,
  Permission.EXPORT_DATA,
];

// Resource types for ownership checks
export enum ResourceType {
  LISTING = 'listing',
  MESSAGE = 'message',
  CONVERSATION = 'conversation',
  USER_PROFILE = 'user_profile',
  REVIEW = 'review',
}

interface AccessContext {
  userId: string;
  userRole: UserRole;
  resourceId?: string;
  resourceType?: ResourceType;
  resourceOwnerId?: string;
}

class RBACService {
  /**
   * Check if a user has a specific permission
   */
  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user can access a resource
   */
  async canAccessResource(context: AccessContext): Promise<boolean> {
    const { userId, userRole, resourceId, resourceType, resourceOwnerId } = context;

    // Check basic permission first
    let requiredPermission: Permission;
    
    switch (resourceType) {
      case ResourceType.LISTING:
        requiredPermission = Permission.READ_PUBLIC_CONTENT;
        break;
      case ResourceType.MESSAGE:
      case ResourceType.CONVERSATION:
        requiredPermission = Permission.SEND_MESSAGE;
        break;
      default:
        requiredPermission = Permission.READ_PUBLIC_CONTENT;
    }

    if (!this.hasPermission(userRole, requiredPermission)) {
      return false;
    }

    // For ownership-based resources, check if user owns the resource or has elevated permissions
    if (resourceOwnerId) {
      // Owner can always access their own resources
      if (userId === resourceOwnerId) {
        return true;
      }

      // Moderators and admins can access most resources
      if (userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN) {
        return true;
      }

      // For conversations, check if user is a participant
      if (resourceType === ResourceType.CONVERSATION && resourceId) {
        return await this.isConversationParticipant(userId, resourceId);
      }

      return false;
    }

    return true;
  }

  /**
   * Check if user can modify a resource
   */
  async canModifyResource(context: AccessContext): Promise<boolean> {
    const { userId, userRole, resourceType, resourceOwnerId } = context;

    // Owner can modify their own resources
    if (userId === resourceOwnerId) {
      let requiredPermission: Permission;
      
      switch (resourceType) {
        case ResourceType.LISTING:
          requiredPermission = Permission.UPDATE_OWN_LISTING;
          break;
        case ResourceType.USER_PROFILE:
          requiredPermission = Permission.UPDATE_OWN_PROFILE;
          break;
        default:
          return false;
      }

      return this.hasPermission(userRole, requiredPermission);
    }

    // Moderators can modify certain resources
    if (userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN) {
      switch (resourceType) {
        case ResourceType.LISTING:
          return this.hasPermission(userRole, Permission.MODERATE_CONTENT);
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Check if user can delete a resource
   */
  async canDeleteResource(context: AccessContext): Promise<boolean> {
    const { userId, userRole, resourceType, resourceOwnerId } = context;

    // Owner can delete their own resources
    if (userId === resourceOwnerId) {
      switch (resourceType) {
        case ResourceType.LISTING:
          return this.hasPermission(userRole, Permission.DELETE_OWN_LISTING);
        default:
          return false;
      }
    }

    // Moderators and admins can delete certain resources
    if (userRole === UserRole.MODERATOR || userRole === UserRole.ADMIN) {
      switch (resourceType) {
        case ResourceType.LISTING:
          return this.hasPermission(userRole, Permission.DELETE_ANY_LISTING);
        default:
          return false;
      }
    }

    return false;
  }

  /**
   * Check if user can assign roles
   */
  canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    // Only admins can assign roles
    if (assignerRole !== UserRole.ADMIN) {
      return false;
    }

    // Admins can assign any role
    return this.hasPermission(assignerRole, Permission.ASSIGN_ROLES);
  }

  /**
   * Check if user can ban other users
   */
  canBanUser(bannerRole: UserRole, targetUserId: string, bannerUserId: string): boolean {
    // Users cannot ban themselves
    if (bannerUserId === targetUserId) {
      return false;
    }

    // Only moderators and admins can ban users
    return this.hasPermission(bannerRole, Permission.BAN_USER);
  }

  /**
   * Get user role from database
   */
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

  /**
   * Update user role (admin only)
   */
  async updateUserRole(
    targetUserId: string, 
    newRole: UserRole, 
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const adminRole = await this.getUserRole(adminUserId);
      
      if (!this.canAssignRole(adminRole, newRole)) {
        return { success: false, error: 'Insufficient permissions to assign roles' };
      }

      await updateDoc(doc(db, 'users', targetUserId), {
        role: newRole,
        updatedAt: serverTimestamp(),
        updatedBy: adminUserId,
      });

      // Log the role change
      await this.logRoleChange(targetUserId, newRole, adminUserId);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ban/unban user
   */
  async updateUserStatus(
    targetUserId: string,
    isActive: boolean,
    moderatorUserId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const moderatorRole = await this.getUserRole(moderatorUserId);
      
      if (!this.canBanUser(moderatorRole, targetUserId, moderatorUserId)) {
        return { success: false, error: 'Insufficient permissions to ban users' };
      }

      await updateDoc(doc(db, 'users', targetUserId), {
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: moderatorUserId,
        banReason: reason || null,
      });

      // Log the status change
      await this.logStatusChange(targetUserId, isActive, moderatorUserId, reason);

      return { success: true };
    } catch (error: any) {
      console.error('Error updating user status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is participant in conversation
   */
  private async isConversationParticipant(userId: string, conversationId: string): Promise<boolean> {
    try {
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      if (conversationDoc.exists()) {
        const participantIds = conversationDoc.data().participantIds || [];
        return participantIds.includes(userId);
      }
      return false;
    } catch (error) {
      console.error('Error checking conversation participation:', error);
      return false;
    }
  }

  /**
   * Log role changes for audit trail
   */
  private async logRoleChange(
    targetUserId: string,
    newRole: UserRole,
    adminUserId: string
  ): Promise<void> {
    try {
      // In a real app, you'd store this in an audit log collection
      console.log(`Role change: User ${targetUserId} assigned role ${newRole} by admin ${adminUserId}`);
    } catch (error) {
      console.error('Error logging role change:', error);
    }
  }

  /**
   * Log status changes for audit trail
   */
  private async logStatusChange(
    targetUserId: string,
    isActive: boolean,
    moderatorUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      // In a real app, you'd store this in an audit log collection
      console.log(`Status change: User ${targetUserId} ${isActive ? 'activated' : 'banned'} by ${moderatorUserId}. Reason: ${reason || 'None'}`);
    } catch (error) {
      console.error('Error logging status change:', error);
    }
  }

  /**
   * Get permissions for a role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check multiple permissions at once
   */
  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * Check if role has all specified permissions
   */
  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }
}

// Create singleton instance
export const rbacService = new RBACService();

// Helper function for checking permissions in components
export async function checkPermission(
  userId: string,
  permission: Permission,
  resourceContext?: {
    resourceId?: string;
    resourceType?: ResourceType;
    resourceOwnerId?: string;
  }
): Promise<boolean> {
  const userRole = await rbacService.getUserRole(userId);
  
  const context: AccessContext = {
    userId,
    userRole,
    ...resourceContext,
  };

  return rbacService.canAccessResource(context);
}

export default rbacService;
