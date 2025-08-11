"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { rbacService, UserRole, Permission } from '@/lib/rbac';
import { twoFactorAuthService } from '@/lib/two-factor-auth';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Settings, 
  Key, 
  Ban, 
  UserCheck, 
  Activity,
  Lock,
  Unlock,
  Crown,
  Star
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: any;
  createdAt: any;
}

interface SecurityDashboardProps {
  currentUserId: string;
}

export function SecurityDashboard({ currentUserId }: SecurityDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.USER);
  const [banReason, setBanReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await rbacService.getAllUsers(currentUserId);
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        setUsers(result.users);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      const result = await rbacService.updateUserRole(userId, role, currentUserId);
      if (result.success) {
        toast({
          title: "Success",
          description: "User role updated successfully",
        });
        loadUsers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
    }
  };

  const handleUserStatusChange = async (userId: string, isActive: boolean, reason?: string) => {
    try {
      const result = await rbacService.updateUserStatus(userId, isActive, currentUserId, reason);
      if (result.success) {
        toast({
          title: "Success",
          description: `User ${isActive ? 'activated' : 'banned'} successfully`,
        });
        loadUsers();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status",
      });
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.MODERATOR:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Crown className="w-3 h-3" />;
      case UserRole.MODERATOR:
        return <Star className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive).length,
    bannedUsers: users.filter(u => !u.isActive).length,
    twoFactorEnabled: users.filter(u => u.twoFactorEnabled).length,
    admins: users.filter(u => u.role === UserRole.ADMIN).length,
    moderators: users.filter(u => u.role === UserRole.MODERATOR).length,
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active, {stats.bannedUsers} banned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.twoFactorEnabled}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.twoFactorEnabled / stats.totalUsers) * 100)}% adoption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins + stats.moderators}</div>
            <p className="text-xs text-muted-foreground">
              {stats.admins} admins, {stats.moderators} moderators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(((stats.twoFactorEnabled / stats.totalUsers) * 50) + 
                          ((stats.activeUsers / stats.totalUsers) * 50))}%
            </div>
            <p className="text-xs text-muted-foreground">Based on 2FA and activity</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="security">Security Settings</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user roles, permissions, and account status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Active" : "Banned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Shield className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastLoginAt ? new Date(user.lastLoginAt.toDate()).toLocaleDateString() : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage User: {user.name}</DialogTitle>
                                <DialogDescription>
                                  Update user role and account status
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Role</label>
                                  <Select value={user.role} onValueChange={(value) => setNewRole(value as UserRole)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={UserRole.USER}>User</SelectItem>
                                      <SelectItem value={UserRole.MODERATOR}>Moderator</SelectItem>
                                      <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {!user.isActive && (
                                  <div>
                                    <label className="text-sm font-medium">Ban Reason</label>
                                    <Input
                                      placeholder="Enter reason for unban..."
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                    />
                                  </div>
                                )}
                              </div>

                              <DialogFooter className="gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleRoleChange(user.id, newRole)}
                                >
                                  Update Role
                                </Button>
                                <Button
                                  variant={user.isActive ? "destructive" : "default"}
                                  onClick={() => handleUserStatusChange(user.id, !user.isActive, banReason)}
                                >
                                  {user.isActive ? (
                                    <>
                                      <Ban className="w-3 h-3 mr-1" />
                                      Ban User
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3 h-3 mr-1" />
                                      Unban User
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure system-wide security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Password Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Minimum 8 characters, must include numbers and special characters
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Users are automatically logged out after 24 hours of inactivity
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">
                    API endpoints are protected with rate limiting to prevent abuse
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Input Sanitization</h4>
                  <p className="text-sm text-muted-foreground">
                    All user input is sanitized to prevent XSS attacks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                Security events and administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Audit logging would be implemented here to track all security-related events,
                role changes, and administrative actions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
