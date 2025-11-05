"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import {
  User,
  Lock,
  Bell,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<
    "profile" | "password" | "notifications"
  >("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
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
    // if (newPassword !== confirmPassword) {
    //   setPasswordError("New passwords do not match");
    //   setPasswordSaving(false);
    //   return;
    // }

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
        // setConfirmPassword("");
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

  const handleNotificationUpdate = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
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
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
      </div>
    );
  }

  return (
    <div className="margin-12">
      {/* Page Title */}
      <h1 className="tp-headline-s text-neutral-0 py-6">
            Profile Settings
          </h1>
     

        {/* Tabs */}
        <div className="flex items-center border-b border-neutral-800 bg-black/90 mb-6">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "password", label: "Password", icon: Lock },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "profile" | "password" | "notifications")
              }
              className={`relative pr-16 py-4 font-semibold text-sm sm:text-base transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-[rgb(var(--brand-400))]"
                  : "text-neutral-300 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[rgb(var(--brand-400))]" />
              )}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="mt-0">
            <div className="card card-custom gutter-b">
              <div className="p-6">
                <h2 className="tp-body font-semibold text-neutral-0 mb-2">
                  {profile?.email}
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="tp-body-s text-neutral-400"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="tp-body-s text-neutral-400"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                    />
                  </div>

                  <Separator className="bg-neutral-800/50" />

                  <div className="flex items-center justify-between">
                    <div className="tp-body-s text-neutral-400">
                      Account created:{" "}
                      {new Date(profile?.createdAt || "").toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {profileSuccess && (
                        <span className="tp-body-s text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Saved
                        </span>
                      )}
                      <Button
                        type="submit"
                        disabled={profileSaving}
                        className="btn button-primary px-15 py-3  hover:bg-brand-300 hover:text-brand-600 mt-8"
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
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div className="mt-0">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid rgb(64, 64, 64)",
                background: "rgb(23, 23, 23)",
              }}
            >
              <div className="p-6">
                <h2 className="tp-body font-semibold text-neutral-0 mb-2">
                  Change Password
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentPassword"
                      className="tp-body-s text-neutral-400"
                    >
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="newPassword"
                      className="tp-body-s text-neutral-400"
                    >
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                    />
                    <p className="tp-body-xs text-neutral-500">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  {/* <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="tp-body-s text-neutral-400"
                    >
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                        className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                      required
                    />
                  </div> */}

                  {passwordError && (
                    <div className="tp-body-s text-red-500">
                      {passwordError}
                    </div>
                  )}

                  <Separator className="bg-neutral-800/50" />

                  <div className="flex items-center justify-end gap-2">
                    {passwordSuccess && (
                      <span className="tp-body-s text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Password changed successfully
                      </span>
                    )}
                    <Button
                      type="submit"
                      disabled={passwordSaving}
                      className="btn button-primary px-15 py-3  hover:bg-brand-300 hover:text-brand-600 mt-8"
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
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="mt-0">
            <div
              className="rounded-xl overflow-hidden"
              style={{
                border: "1px solid rgb(64, 64, 64)",
                background: "rgb(23, 23, 23)",
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="tp-body font-semibold text-neutral-0 mb-2">
                      Notification Preferences
                    </h2>
                  </div>
                  {notificationsSuccess && (
                    <span className="tp-body-s text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6 space-y-6">
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

                    <Separator className="bg-neutral-800/50" />

                    {/* Notification Channels */}
                    <div>
                      {/* <h3 className="tp-body font-semibold text-neutral-0 mb-4">
                        Notification Channels
                      </h3> */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <Label
                              htmlFor="notify_email"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              Email Notifications
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Receive notifications via email
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "notify_email",
                                !notifications.notify_email
                              )
                            }
                            disabled={notificationsSaving}
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.notify_email ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-1">
                          <div>
                            <Label
                              htmlFor="notify_telegram"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              Telegram Notifications
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Receive notifications via Telegram (must connect
                              above)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "notify_telegram",
                                !notifications.notify_telegram
                              )
                            }
                            disabled={
                              notificationsSaving || !profile.telegram_chat_id
                            }
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.notify_telegram ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-neutral-800/50" />

                    {/* Notification Types */}
                    <div>
                      {/* <h3 className="tp-body font-semibold text-neutral-0">
                        Notification Types
                      </h3> */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label
                              htmlFor="proxy_expiry_alerts"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              Proxy Expiry Alerts
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Get notified when your proxies are about to expire
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "proxy_expiry_alerts",
                                !notifications.proxy_expiry_alerts
                              )
                            }
                            disabled={notificationsSaving}
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.proxy_expiry_alerts ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label
                              htmlFor="renewal_reminders"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              Renewal Reminders
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Reminders for subscription renewals
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "renewal_reminders",
                                !notifications.renewal_reminders
                              )
                            }
                            disabled={notificationsSaving}
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.renewal_reminders ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label
                              htmlFor="payment_confirmations"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              Payment Confirmations
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Notifications for successful payments
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "payment_confirmations",
                                !notifications.payment_confirmations
                              )
                            }
                            disabled={notificationsSaving}
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.payment_confirmations ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label
                              htmlFor="system_updates"
                              className="tp-body-s text-neutral-0 font-medium"
                            >
                              System Updates
                            </Label>
                            <p className="tp-body-s text-neutral-400 mt-1">
                              Get notified about system maintenance and updates
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleNotificationUpdate(
                                "system_updates",
                                !notifications.system_updates
                              )
                            }
                            disabled={notificationsSaving}
                            className="disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {notifications.system_updates ? (
                              <ToggleRight className="h-10 w-10 text-[rgb(var(--brand-400))]" />
                            ) : (
                              <ToggleLeft className="h-10 w-10 text-neutral-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

  );
}
