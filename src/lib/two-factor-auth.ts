"use server";

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorVerificationResult {
  success: boolean;
  error?: string;
  backupCodeUsed?: boolean;
}

class TwoFactorAuthService {
  private readonly appName = 'CommonTable';
  private readonly issuer = 'CommonTable App';

  /**
   * Generate a new 2FA secret and QR code for user setup
   */
  async generateTwoFactorSecret(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.appName} (${userEmail})`,
      issuer: this.issuer,
      length: 32,
    });

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store the temporary secret (not activated until verified)
    await this.storeTempSecret(userId, secret.base32, backupCodes);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify 2FA setup and activate it
   */
  async verifyAndActivateTwoFactor(
    userId: string,
    token: string
  ): Promise<TwoFactorVerificationResult> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      const tempSecret = userData.tempTwoFactorSecret;

      if (!tempSecret) {
        return { success: false, error: 'No 2FA setup in progress' };
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: tempSecret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps (60 seconds) tolerance
      });

      if (!verified) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Activate 2FA
      await updateDoc(doc(db, 'users', userId), {
        twoFactorSecret: tempSecret,
        twoFactorEnabled: true,
        twoFactorActivatedAt: serverTimestamp(),
        tempTwoFactorSecret: null, // Remove temp secret
        backupCodes: userData.tempBackupCodes || [],
        tempBackupCodes: null, // Remove temp backup codes
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Verify 2FA token during login
   */
  async verifyTwoFactorToken(
    userId: string,
    token: string
  ): Promise<TwoFactorVerificationResult> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      
      if (!userData.twoFactorEnabled) {
        return { success: false, error: '2FA not enabled for this user' };
      }

      // Try TOTP verification first
      const verified = speakeasy.totp.verify({
        secret: userData.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (verified) {
        return { success: true };
      }

      // If TOTP fails, check backup codes
      const backupCodeResult = await this.verifyBackupCode(userId, token);
      if (backupCodeResult.success) {
        return { success: true, backupCodeUsed: true };
      }

      return { success: false, error: 'Invalid verification code' };
    } catch (error: any) {
      console.error('Error verifying 2FA token:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you'd verify the password here
      // For now, we'll just disable 2FA
      
      await updateDoc(doc(db, 'users', userId), {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        twoFactorDisabledAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: 'Failed to disable 2FA' };
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string): Promise<{ success: boolean; backupCodes?: string[]; error?: string }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: 'User not found' };
      }

      const userData = userDoc.data();
      
      if (!userData.twoFactorEnabled) {
        return { success: false, error: '2FA not enabled' };
      }

      const newBackupCodes = this.generateBackupCodes();

      await updateDoc(doc(db, 'users', userId), {
        backupCodes: newBackupCodes,
        backupCodesGeneratedAt: serverTimestamp(),
      });

      return { success: true, backupCodes: newBackupCodes };
    } catch (error: any) {
      console.error('Error generating backup codes:', error);
      return { success: false, error: 'Failed to generate backup codes' };
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() && userDoc.data().twoFactorEnabled === true;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Get 2FA status and info
   */
  async getTwoFactorInfo(userId: string): Promise<{
    enabled: boolean;
    backupCodesCount?: number;
    activatedAt?: any;
  }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { enabled: false };
      }

      const userData = userDoc.data();
      
      return {
        enabled: userData.twoFactorEnabled === true,
        backupCodesCount: userData.backupCodes?.length || 0,
        activatedAt: userData.twoFactorActivatedAt,
      };
    } catch (error) {
      console.error('Error getting 2FA info:', error);
      return { enabled: false };
    }
  }

  /**
   * Verify backup code and mark as used
   */
  private async verifyBackupCode(userId: string, code: string): Promise<{ success: boolean }> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        return { success: false };
      }

      const userData = userDoc.data();
      const backupCodes = userData.backupCodes || [];
      
      // Check if code exists and hasn't been used
      const codeIndex = backupCodes.findIndex((c: any) => c.code === code && !c.used);
      
      if (codeIndex === -1) {
        return { success: false };
      }

      // Mark code as used
      backupCodes[codeIndex].used = true;
      backupCodes[codeIndex].usedAt = serverTimestamp();

      await updateDoc(doc(db, 'users', userId), {
        backupCodes,
      });

      return { success: true };
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return { success: false };
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): Array<{ code: string; used: boolean }> {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push({
        code: this.generateRandomCode(),
        used: false,
      });
    }
    return codes;
  }

  /**
   * Generate a random backup code
   */
  private generateRandomCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Store temporary secret during setup
   */
  private async storeTempSecret(userId: string, secret: string, backupCodes: Array<{ code: string; used: boolean }>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      tempTwoFactorSecret: secret,
      tempBackupCodes: backupCodes,
      twoFactorSetupStartedAt: serverTimestamp(),
    });
  }

  /**
   * Cancel 2FA setup
   */
  async cancelTwoFactorSetup(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        tempTwoFactorSecret: null,
        tempBackupCodes: null,
        twoFactorSetupStartedAt: null,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error canceling 2FA setup:', error);
      return { success: false, error: 'Failed to cancel setup' };
    }
  }

  /**
   * Generate current TOTP token (for testing purposes)
   */
  generateCurrentToken(secret: string): string {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  }
}

// Create singleton instance
export const twoFactorAuthService = new TwoFactorAuthService();

// Helper functions for easy use in components
export async function requireTwoFactor(userId: string): Promise<boolean> {
  return twoFactorAuthService.isTwoFactorEnabled(userId);
}

export async function verifyTwoFactorForAction(
  userId: string,
  token: string
): Promise<boolean> {
  const result = await twoFactorAuthService.verifyTwoFactorToken(userId, token);
  return result.success;
}

export default twoFactorAuthService;
