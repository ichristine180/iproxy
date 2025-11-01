"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Bell, Loader2, CheckCircle2 } from "lucide-react";
import { TelegramSetup } from "@/components/TelegramSetup";

interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  telegram_chat_id: string;
  notify_email: boolean;
  notify_telegram: boolean;
  proxy_expiry_alerts: boolean;
  renewal_reminders: boolean;
  payment_confirmations: boolean;
  system_updates: boolean;
}

interface NotificationPreferences {
  user_id: string;
  notify_email: boolean;
  notify_telegram: boolean;
  proxy_expiry_alerts: boolean;
  renewal_reminders: boolean;
  payment_confirmations: boolean;
  system_updates: boolean;
}

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notification saving state
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSuccess, setNotificationsSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || "");
        setPhone(data.profile.phone || "");

        // Set notification preferences from profile
        console.log( data.profile);
        
        setNotifications({
          user_id: data.profile.id,
          notify_email: data.profile.notify_email ?? true,
          notify_telegram: data.profile.notify_telegram ?? false,
          proxy_expiry_alerts: data.profile.proxy_expiry_alerts ?? true,
          renewal_reminders: data.profile.renewal_reminders ?? true,
          payment_confirmations: data.profile.payment_confirmations ?? true,
          system_updates: data.profile.system_updates ?? false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    // Notifications are now fetched with profile, so this is just a fallback
    try {
      const response = await fetch("/api/profile/notifications");
      const data = await response.json();

      if (data.success && data.preferences) {
        setNotifications(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfileSuccess(true);
        await refreshUser();
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(false);
    setPasswordError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      setPasswordSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordError("Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleNotificationUpdate = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifications) return;

    const updatedNotifications = {
      ...notifications,
      [key]: value,
    };

    setNotifications(updatedNotifications);
    setNotificationsSaving(true);
    setNotificationsSuccess(false);

    try {
      const response = await fetch("/api/profile/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNotifications),
      });

      const data = await response.json();

      if (data.success) {
        setNotificationsSuccess(true);
        setTimeout(() => setNotificationsSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      // Revert on error
      setNotifications(notifications);
    } finally {
      setNotificationsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral-900 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="text-neutral-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800">
            <TabsTrigger value="profile" className="data-[state=active]:bg-neutral-700">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="data-[state=active]:bg-neutral-700">
              <Lock className="h-4 w-4 mr-2" />
              Password
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-neutral-700">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-neutral-400">
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-200">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-neutral-900 border-neutral-700 text-neutral-400"
                    />
                    <p className="text-xs text-neutral-500">
                      Email cannot be changed. {profile?.emailVerified && " Verified"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-neutral-200">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-neutral-200">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="bg-neutral-900 border-neutral-700 text-white"
                    />
                  </div>

                  <Separator className="bg-neutral-700" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-neutral-400">
                      Account created: {new Date(profile?.createdAt || "").toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {profileSuccess && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Saved
                        </span>
                      )}
                      <Button
                        type="submit"
                        disabled={profileSaving}
                        className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="mt-6">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription className="text-neutral-400">
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-neutral-200">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="bg-neutral-900 border-neutral-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-neutral-200">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="bg-neutral-900 border-neutral-700 text-white"
                      required
                    />
                    <p className="text-xs text-neutral-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-neutral-200">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="bg-neutral-900 border-neutral-700 text-white"
                      required
                    />
                  </div>

                  {passwordError && (
                    <div className="text-red-500 text-sm">{passwordError}</div>
                  )}

                  <Separator className="bg-neutral-700" />

                  <div className="flex items-center justify-end gap-2">
                    {passwordSuccess && (
                      <span className="text-green-500 text-sm flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Password changed successfully
                      </span>
                    )}
                    <Button
                      type="submit"
                      disabled={passwordSaving}
                      className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
                    >
                      {passwordSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-neutral-400">
                  Manage how you receive notifications and alerts
                </CardDescription>
                {notificationsSuccess && (
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Preferences saved
                  </span>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {notifications && profile && (
                  <>
                    {/* Telegram Setup */}
                    <div>
                      <TelegramSetup
                        userId={profile.id}
                        currentChatId={profile.telegram_chat_id}
                        onUpdate={fetchProfile}
                      />
                    </div>

                    <Separator className="bg-neutral-700" />

                    {/* Notification Channels */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Notification Channels
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notify_email" className="text-neutral-200">
                              Email Notifications
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            id="notify_email"
                            checked={notifications.notify_email}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("notify_email", checked)
                            }
                            disabled={notificationsSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notify_telegram" className="text-neutral-200">
                              Telegram Notifications
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Receive notifications via Telegram (must connect above)
                            </p>
                          </div>
                          <Switch
                            id="notify_telegram"
                            checked={notifications.notify_telegram}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("notify_telegram", checked)
                            }
                            disabled={notificationsSaving || !profile.telegram_chat_id}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-neutral-700" />

                    {/* Notification Types */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Notification Types
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="proxy_expiry_alerts" className="text-neutral-200">
                              Proxy Expiry Alerts
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Get notified when your proxies are about to expire
                            </p>
                          </div>
                          <Switch
                            id="proxy_expiry_alerts"
                            checked={notifications.proxy_expiry_alerts}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("proxy_expiry_alerts", checked)
                            }
                            disabled={notificationsSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="renewal_reminders" className="text-neutral-200">
                              Renewal Reminders
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Reminders for subscription renewals
                            </p>
                          </div>
                          <Switch
                            id="renewal_reminders"
                            checked={notifications.renewal_reminders}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("renewal_reminders", checked)
                            }
                            disabled={notificationsSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="payment_confirmations" className="text-neutral-200">
                              Payment Confirmations
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Notifications for successful payments
                            </p>
                          </div>
                          <Switch
                            id="payment_confirmations"
                            checked={notifications.payment_confirmations}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("payment_confirmations", checked)
                            }
                            disabled={notificationsSaving}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="system_updates" className="text-neutral-200">
                              System Updates
                            </Label>
                            <p className="text-sm text-neutral-400">
                              Get notified about system maintenance and updates
                            </p>
                          </div>
                          <Switch
                            id="system_updates"
                            checked={notifications.system_updates}
                            onCheckedChange={(checked) =>
                              handleNotificationUpdate("system_updates", checked)
                            }
                            disabled={notificationsSaving}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
