"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { twoFactorAuthService } from '@/lib/two-factor-auth';
import { 
  Shield, 
  Smartphone, 
  Copy, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Key,
  QrCode
} from 'lucide-react';

interface TwoFactorSetupProps {
  userId: string;
  userEmail: string;
  isEnabled: boolean;
  onStatusChange: () => void;
}

export function TwoFactorSetup({ userId, userEmail, isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'backup'>('initial');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const { toast } = useToast();

  const startSetup = async () => {
    setLoading(true);
    try {
      const result = await twoFactorAuthService.generateTwoFactorSecret(userId, userEmail);
      setSetupData(result);
      setStep('setup');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || !setupData) return;

    setLoading(true);
    try {
      const result = await twoFactorAuthService.verifyAndActivateTwoFactor(userId, verificationCode);
      if (result.success) {
        setStep('backup');
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been successfully enabled.",
        });
        onStatusChange();
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    try {
      const result = await twoFactorAuthService.disableTwoFactor(userId, ''); // Password verification would be needed
      if (result.success) {
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled.",
        });
        onStatusChange();
        setStep('initial');
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Disable",
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Disable",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    setLoading(true);
    try {
      const result = await twoFactorAuthService.generateNewBackupCodes(userId);
      if (result.success && result.backupCodes) {
        setSetupData(prev => prev ? { ...prev, backupCodes: result.backupCodes! } : null);
        setShowBackupCodes(true);
        toast({
          title: "New Backup Codes Generated",
          description: "Your old backup codes are no longer valid.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed",
          description: result.error,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;
    
    const content = setupData.backupCodes.map(code => code.code || code).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commontable-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isEnabled && step === 'initial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Your account is protected with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm">2FA is enabled and active</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateNewBackupCodes} disabled={loading}>
              <Key className="w-4 h-4 mr-2" />
              Generate New Backup Codes
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  Disable 2FA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to disable 2FA? This will make your account less secure.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive" onClick={disable2FA} disabled={loading}>
                    Disable 2FA
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {showBackupCodes && setupData?.backupCodes && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm">New Backup Codes</CardTitle>
                <CardDescription className="text-xs">
                  Save these codes in a secure location. Each code can only be used once.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span>{typeof code === 'string' ? code : code.code}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(typeof code === 'string' ? code : code.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadBackupCodes}
                  className="mt-2"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Codes
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'initial' && (
          <>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">2FA is not enabled</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account by requiring 
              a verification code from your mobile device in addition to your password.
            </p>
            <Button onClick={startSetup} disabled={loading}>
              <Smartphone className="w-4 h-4 mr-2" />
              Enable 2FA
            </Button>
          </>
        )}

        {step === 'setup' && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="inline-block p-4 bg-white border rounded-lg">
                <img src={setupData.qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Or enter this code manually:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="px-3 py-1 bg-muted rounded font-mono text-sm">
                  {setupData.secret}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep('verify')} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setStep('setup')} variant="outline">
                Back
              </Button>
              <Button 
                onClick={verifySetup} 
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                Verify & Enable
              </Button>
            </div>
          </div>
        )}

        {step === 'backup' && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium">2FA Enabled Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your account is now protected with two-factor authentication.
              </p>
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-sm">Backup Codes</CardTitle>
                <CardDescription className="text-xs">
                  Save these backup codes in a secure location. You can use them to access your account if you lose your phone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span>{typeof code === 'string' ? code : code.code}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(typeof code === 'string' ? code : code.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadBackupCodes}
                  className="mt-2"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download Codes
                </Button>
              </CardContent>
            </Card>

            <Button onClick={() => setStep('initial')} className="w-full">
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
