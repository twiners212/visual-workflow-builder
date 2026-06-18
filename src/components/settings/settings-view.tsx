"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Palette, 
  Settings as SettingsIcon, 
  Sliders, 
  Upload, 
  Trash2, 
  Save, 
  Loader2, 
  AlertTriangle, 
  Lock, 
  Globe, 
  Clock, 
  ShieldAlert, 
  Bell, 
  Keyboard, 
  Settings2,
  FileCheck
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { updateSettingsAction, getSettingsAction, deleteAccountAction } from "@/features/settings/server/actions";
import { useTheme, AccentColor } from "@/components/theme-provider";

type SettingsTab = "profile" | "appearance" | "account" | "preferences";

interface UserPreferences {
  theme: "system" | "light" | "dark";
  accentColor: AccentColor;
  canvas: {
    showGrid: boolean;
    snapToGrid: boolean;
    showMinimap: boolean;
    enableAnimations: boolean;
  };
  compactMode: boolean;
  notifications: {
    workflowFailures: boolean;
    teamInvitations: boolean;
    productUpdates: boolean;
  };
  workflow: {
    autoSave: boolean;
    defaultZoom: number;
  };
  editor: {
    enableKeyboardShortcuts: boolean;
    autoSelectNewNode: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  accentColor: "blue",
  canvas: {
    showGrid: true,
    snapToGrid: false,
    showMinimap: true,
    enableAnimations: true,
  },
  compactMode: false,
  notifications: {
    workflowFailures: true,
    teamInvitations: true,
    productUpdates: false,
  },
  workflow: {
    autoSave: true,
    defaultZoom: 1,
  },
  editor: {
    enableKeyboardShortcuts: true,
    autoSelectNewNode: true,
  },
};

export function SettingsView() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const toast = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, accentColor: activeAccentColor, setAccentColor } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loadingDb, setLoadingDb] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Database-backed states (Initial loaded values)
  const [initialFirstName, setInitialFirstName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [initialImage, setInitialImage] = useState<string | null>(null);
  const [initialBio, setInitialBio] = useState("");
  const [initialPreferences, setInitialPreferences] = useState<UserPreferences>(defaultPreferences);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Modals/Dialogs
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState<SettingsTab | null>(null);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteEmailConfirmation, setDeleteEmailConfirmation] = useState("");

  // Load Database and Session Settings
  useEffect(() => {
    async function loadSettings() {
      if (session?.user) {
        const user = session.user;
        const fullName = user.name || "";
        const lastSpaceIdx = fullName.lastIndexOf(" ");
        
        let first = fullName;
        let last = "";
        if (lastSpaceIdx !== -1) {
          first = fullName.substring(0, lastSpaceIdx);
          last = fullName.substring(lastSpaceIdx + 1);
        }

        setInitialFirstName(first);
        setFirstName(first);
        setInitialLastName(last);
        setLastName(last);
        setInitialEmail(user.email || "");
        setEmail(user.email || "");
        setInitialImage(user.image || null);
        setImage(user.image || null);

        // Fetch DB biography and preferences
        const res = await getSettingsAction();
        if (res.success && res.data) {
          setInitialBio(res.data.biography);
          setBio(res.data.biography);
          
          const mergedPrefs = {
            ...defaultPreferences,
            ...res.data.preferences,
            canvas: { ...defaultPreferences.canvas, ...(res.data.preferences as any)?.canvas },
            notifications: { ...defaultPreferences.notifications, ...(res.data.preferences as any)?.notifications },
            workflow: { ...defaultPreferences.workflow, ...(res.data.preferences as any)?.workflow },
            editor: { ...defaultPreferences.editor, ...(res.data.preferences as any)?.editor },
          };

          setInitialPreferences(mergedPrefs);
          setPreferences(mergedPrefs);
          
          // Apply initial theme and accent color immediately
          applyTheme(mergedPrefs.theme);
          setAccentColor(mergedPrefs.accentColor);
        }
        setLoadingDb(false);
      }
    }
    
    if (!sessionPending) {
      loadSettings();
    }
  }, [session, sessionPending]);

  // Compute dirty (unsaved) states
  const isProfileDirty = 
    firstName !== initialFirstName || 
    lastName !== initialLastName || 
    email !== initialEmail || 
    bio !== initialBio || 
    image !== initialImage;

  const isAppearanceDirty = 
    preferences.theme !== initialPreferences.theme ||
    preferences.accentColor !== initialPreferences.accentColor;

  const isAccountDirty = 
    currentPassword !== "" || 
    newPassword !== "" || 
    confirmPassword !== "";

  const isPreferencesDirty = 
    preferences.notifications.workflowFailures !== initialPreferences.notifications.workflowFailures ||
    preferences.notifications.teamInvitations !== initialPreferences.notifications.teamInvitations ||
    preferences.notifications.productUpdates !== initialPreferences.notifications.productUpdates ||
    preferences.workflow.autoSave !== initialPreferences.workflow.autoSave ||
    preferences.workflow.defaultZoom !== initialPreferences.workflow.defaultZoom ||
    preferences.editor.enableKeyboardShortcuts !== initialPreferences.editor.enableKeyboardShortcuts ||
    preferences.editor.autoSelectNewNode !== initialPreferences.editor.autoSelectNewNode;

  const isDirty = isProfileDirty || isAppearanceDirty || isAccountDirty || isPreferencesDirty;

  // Warn on page unload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Intercept client-side routing/link clicks if form is dirty
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;

      // Ignore if not left-click, or if modifier keys are pressed (middle-click, cmd/ctrl, etc.)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Find the closest anchor tag
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");
        
        // If it is an internal link that moves away from /settings
        if (href && href.startsWith("/") && href !== "/settings" && !href.startsWith("/settings?")) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigationUrl(href);
          setShowUnsavedModal(true);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, true);
    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [isDirty, router]);

  // Apply Theme Immediately helper
  const applyTheme = (t: "system" | "light" | "dark") => {
    setTheme(t);
  };

  // Switch Tab Handler with Unsaved Alert Warning
  const handleTabClick = (tab: SettingsTab) => {
    if (tab === activeTab) return;
    if (isDirty) {
      setPendingTabSwitch(tab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  const confirmTabSwitch = () => {
    // Discard current changes and reset forms
    if (pendingTabSwitch) {
      handleDiscardChanges();
      setActiveTab(pendingTabSwitch);
    } else if (pendingNavigationUrl) {
      handleDiscardChanges();
      router.push(pendingNavigationUrl);
    }
    setShowUnsavedModal(false);
    setPendingTabSwitch(null);
    setPendingNavigationUrl(null);
  };

  const handleDiscardChanges = () => {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setEmail(initialEmail);
    setImage(initialImage);
    setBio(initialBio);
    setPreferences(initialPreferences);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    applyTheme(initialPreferences.theme);
    setAccentColor(initialPreferences.accentColor);
  };

  // Accent Color classes map for premium themed elements
  // Since CSS variables dynamically map the active accent color to Tailwind's 'primary' and 'surface-tint',
  // we can use standard classes that adapt dynamically to any active color!
  const currentAccent = {
    primary: "bg-primary hover:bg-surface-tint border-primary text-on-primary ring-primary",
    text: "text-primary",
    border: "border-primary",
    focusRing: "focus:ring-primary focus:border-primary",
  };

  // Save changes handler for forms
  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "profile" && !firstName.trim()) {
      toast.error("First Name is required.");
      return;
    }

    setSaving(true);
    try {
      if (activeTab === "profile") {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        
        // 1. Update Better Auth Profile
        const { error: authError } = await authClient.updateUser({
          name: fullName,
          image: image || "",
        });

        if (authError) {
          toast.error(authError.message || "Failed to update authentication profile.");
          setSaving(false);
          return;
        }

        // Handle email change if edited
        if (email.trim() !== initialEmail) {
          const { error: emailError } = await authClient.changeEmail({
            newEmail: email.trim(),
          });
          if (emailError) {
            toast.error(emailError.message || "Failed to trigger email change.");
            setSaving(false);
            return;
          }
          toast.info("Email verification link sent. Please verify your new email.");
        }

        // 2. Save biography and references to DB
        const res = await updateSettingsAction(bio, preferences);
        if (res.success) {
          setInitialFirstName(firstName);
          setInitialLastName(lastName);
          setInitialEmail(email);
          setInitialImage(image);
          setInitialBio(bio);
          toast.success("Profile saved successfully.");
        } else {
          toast.error(res.error || "Failed to save biography.");
        }
      } 
      
      else if (activeTab === "appearance" || activeTab === "preferences") {
        // Save preferences to DB
        const res = await updateSettingsAction(bio, preferences);
        if (res.success) {
          setInitialPreferences(preferences);
          applyTheme(preferences.theme);
          setAccentColor(preferences.accentColor);
          toast.success("Preferences updated successfully.");
        } else {
          toast.error(res.error || "Failed to save preferences.");
        }
      } 
      
      else if (activeTab === "account") {
        // Change password form validation
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("All password fields are required.");
          setSaving(false);
          return;
        }
        if (newPassword.length < 8) {
          toast.error("New password must be at least 8 characters long.");
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New password and confirm password do not match.");
          setSaving(false);
          return;
        }

        const { error: pwError } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });

        if (pwError) {
          toast.error(pwError.message || "Failed to change password. Please verify current password.");
        } else {
          toast.success("Password changed successfully and other sessions revoked.");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Profile Picture Upload Handler
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Account Deletion Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }
    if (deleteEmailConfirmation !== session?.user?.email) {
      toast.error("Please type your correct active email to confirm account deletion.");
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteAccountAction(deleteEmailConfirmation);
      if (res.success) {
        toast.success("Account deleted successfully.");
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete account.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting account.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Rendering Helper for active settings panel
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="flex flex-col gap-xl">
            {/* Avatar Section */}
            <div className="flex items-start gap-lg flex-col sm:flex-row">
              <div className="relative group shrink-0">
                {image ? (
                  <img
                    className="w-24 h-24 rounded-full border border-outline-variant object-cover shadow-sm group-hover:border-primary transition-colors"
                    src={image}
                    alt="User Avatar"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border border-outline-variant bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-2xl shadow-sm">
                    {firstName.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-surface-container-lowest border border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col justify-center py-2">
                <h3 className="font-body-lg text-body-lg font-medium text-on-surface">Profile Picture</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                  PNG, JPG or GIF up to 5MB. Recommended 256x256px.
                </p>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    Upload Image
                  </button>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="px-md py-sm bg-transparent rounded-md font-body-md text-sm font-medium text-error hover:bg-error-container transition-colors focus:outline-none focus:ring-2 focus:ring-error"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Inputs */}
            <div className="flex flex-col gap-lg max-w-2xl w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-label-md text-on-surface">First Name</label>
                  <input
                    className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                    placeholder="Enter first name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-label-md text-on-surface">Last Name</label>
                  <input
                    className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                    placeholder="Enter last name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-sm">
                <label className="font-label-md text-label-md text-on-surface">Email Address</label>
                <input
                  className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="font-body-md text-xs text-on-surface-variant mt-1">
                  This is the email used for system notifications and workflow alerts.
                </p>
              </div>

              <div className="flex flex-col gap-sm">
                <div className="flex justify-between items-end">
                  <label className="font-label-md text-label-md text-on-surface">Biography</label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {bio.length} / 500 characters
                  </span>
                </div>
                <textarea
                  className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-y transition-shadow shadow-sm ${currentAccent.focusRing}`}
                  placeholder="Brief description for your profile..."
                  rows={5}
                  maxLength={500}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="flex flex-col gap-xl max-w-2xl w-full">
            {/* Theme */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface">Application Theme</label>
              <div className="grid grid-cols-3 gap-md">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setPreferences({ ...preferences, theme: t });
                      applyTheme(t);
                    }}
                    className={`px-md py-lg rounded-xl border flex flex-col items-center gap-sm transition-all ${
                      preferences.theme === t
                        ? `bg-surface-container-high border-2 ${currentAccent.border}`
                        : "border-outline-variant bg-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {t === "light" && <Palette className="w-6 h-6 text-on-surface" />}
                    {t === "dark" && <Lock className="w-6 h-6 text-on-surface" />}
                    {t === "system" && <Settings2 className="w-6 h-6 text-on-surface" />}
                    <span className="font-body-md text-sm capitalize font-medium">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Accent Color */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface">Accent Color</label>
              <div className="flex flex-wrap gap-md">
                {(["blue", "purple", "green", "orange", "red", "pink", "indigo", "yellow"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setPreferences({ ...preferences, accentColor: c });
                      setAccentColor(c);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                      preferences.accentColor === c
                        ? "border-on-surface ring-2 ring-offset-2 ring-primary scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: 
                        c === "blue" ? "#004ac6" : 
                        c === "purple" ? "#9333ea" : 
                        c === "green" ? "#16a34a" : 
                        c === "orange" ? "#ea580c" :
                        c === "red" ? "#dc2626" :
                        c === "pink" ? "#db2777" :
                        c === "indigo" ? "#4f46e5" : "#ca8a04"
                    }}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  >
                    {preferences.accentColor === c && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>


          </div>
        );

      case "account":
        return (
          <div className="flex flex-col gap-xl max-w-2xl w-full">
            {/* Change Password */}
            <div className="flex flex-col gap-sm">
              <h3 className="font-body-lg text-body-lg font-medium text-on-surface flex items-center gap-sm">
                <Lock className="w-[18px] h-[18px]" />
                Change Password
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-md">
                Ensure your account is secure by using a strong password.
              </p>
              
              <div className="flex flex-col gap-md">
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-label-md text-on-surface">Current Password</label>
                  <input
                    className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                    placeholder="Enter current password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-label-md text-on-surface">New Password</label>
                  <input
                    className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                    placeholder="Min 8 characters"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-sm">
                  <label className="font-label-md text-label-md text-on-surface">Confirm New Password</label>
                  <input
                    className={`w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow shadow-sm ${currentAccent.focusRing}`}
                    placeholder="Repeat new password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Current Session */}
            <div className="flex flex-col gap-sm">
              <h3 className="font-body-lg text-body-lg font-medium text-on-surface flex items-center gap-sm">
                <Globe className="w-[18px] h-[18px]" />
                Active Session
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                This is the browser session you are currently using.
              </p>
              {session?.session && (
                <div className="bg-surface-container rounded-xl p-md flex flex-col gap-sm border border-outline-variant text-sm">
                  <div className="flex items-center gap-md">
                    <Globe className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <div>
                      <span className="font-semibold text-on-surface">IP Address</span>
                      <p className="text-on-surface-variant">{session.session.ipAddress || "127.0.0.1"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <Clock className="w-5 h-5 text-on-surface-variant shrink-0" />
                    <div>
                      <span className="font-semibold text-on-surface">Last Active</span>
                      <p className="text-on-surface-variant">
                        {new Date(session.session.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant border-t border-outline-variant/30 pt-sm mt-xs overflow-x-auto whitespace-nowrap">
                    <strong>User Agent:</strong> {session.session.userAgent || "Unknown Browser"}
                  </div>
                </div>
              )}
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Danger Zone */}
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-lg flex flex-col gap-md">
              <div className="flex items-center gap-md text-red-600 dark:text-red-400">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-body-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h3>
                  <p className="font-body-md text-sm text-red-600/80 dark:text-red-400/80">
                    Irreversible actions that delete your data.
                  </p>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant">
                Deleting your account will erase all workflows, executions, nodes, edges, logs, and account configurations permanently.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-md py-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-body-md text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="flex flex-col gap-xl max-w-2xl w-full">
            {/* Notifications */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-sm">
                <Bell className="w-[18px] h-[18px]" />
                Notification Preferences
              </label>
              <div className="flex flex-col gap-md">
                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.workflowFailures}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, workflowFailures: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Workflow Failures</span>
                    <p className="text-xs text-on-surface-variant">Get notified immediately when a running workflow fails.</p>
                  </div>
                </label>

                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.teamInvitations}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, teamInvitations: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Team Invitations</span>
                    <p className="text-xs text-on-surface-variant">Get notified when added or invited to another workspace.</p>
                  </div>
                </label>

                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.notifications.productUpdates}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        notifications: { ...preferences.notifications, productUpdates: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Product Updates</span>
                    <p className="text-xs text-on-surface-variant">Receive newsletter updates about new nodes, updates and tips.</p>
                  </div>
                </label>
              </div>
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Workflow preferences */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-sm">
                <Settings2 className="w-[18px] h-[18px]" />
                Workflow Behavior
              </label>
              <div className="flex flex-col gap-md">
                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.workflow.autoSave}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        workflow: { ...preferences.workflow, autoSave: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Auto Save Drafts</span>
                    <p className="text-xs text-on-surface-variant">Automatically save changes on the canvas with 3-second debouncing.</p>
                  </div>
                </label>

                <div className="flex flex-col gap-sm max-w-xs pt-xs">
                  <label className="font-label-md text-xs text-on-surface">Default Canvas Zoom</label>
                  <select
                    value={preferences.workflow.defaultZoom}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        workflow: { ...preferences.workflow, defaultZoom: parseFloat(e.target.value) },
                      })
                    }
                    className={`px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-shadow ${currentAccent.focusRing}`}
                  >
                    <option value="0.5">50% (Zoom Out)</option>
                    <option value="0.75">75%</option>
                    <option value="1">100% (Default)</option>
                    <option value="1.25">125%</option>
                    <option value="1.5">150% (Zoom In)</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant opacity-50" />

            {/* Keyboard & Shortcuts */}
            <div className="flex flex-col gap-sm">
              <label className="font-label-md text-label-md text-on-surface flex items-center gap-sm">
                <Keyboard className="w-[18px] h-[18px]" />
                Editor Behavior
              </label>
              <div className="flex flex-col gap-md">
                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.editor.enableKeyboardShortcuts}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        editor: { ...preferences.editor, enableKeyboardShortcuts: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Enable Keyboard Shortcuts</span>
                    <p className="text-xs text-on-surface-variant">Enable shortcuts like undo (Ctrl+Z), copy (Ctrl+C), delete, etc.</p>
                  </div>
                </label>

                <label className="flex items-center gap-md cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={preferences.editor.autoSelectNewNode}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        editor: { ...preferences.editor, autoSelectNewNode: e.target.checked },
                      })
                    }
                    className="rounded text-primary focus:ring-primary shrink-0 w-4 h-4 border-outline-variant"
                  />
                  <div>
                    <span className="font-body-md font-medium text-on-surface">Auto Select New Nodes</span>
                    <p className="text-xs text-on-surface-variant">Focus and highlight newly created nodes instantly on drop.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-xl w-full max-w-[1200px] mx-auto h-full relative z-10 p-4">
      {/* Left Side Navigation */}
      <aside className="w-full md:w-56 flex-shrink-0 flex flex-col gap-xs pt-sm">
        <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm px-md select-none">
          Settings Menu
        </div>
        <button
          onClick={() => handleTabClick("profile")}
          className={`px-md py-sm rounded-md font-medium flex items-center gap-sm w-full text-left transition-all active:opacity-95 border-l-2 ${
            activeTab === "profile"
              ? `bg-surface-container-highest text-on-surface ${currentAccent.border}`
              : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
          }`}
        >
          <User className="w-[18px] h-[18px]" />
          Profile
        </button>
        <button
          onClick={() => handleTabClick("appearance")}
          className={`px-md py-sm rounded-md font-medium flex items-center gap-sm w-full text-left transition-all active:opacity-95 border-l-2 ${
            activeTab === "appearance"
              ? `bg-surface-container-highest text-on-surface ${currentAccent.border}`
              : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
          }`}
        >
          <Palette className="w-[18px] h-[18px]" />
          Appearance
        </button>
        <button
          onClick={() => handleTabClick("account")}
          className={`px-md py-sm rounded-md font-medium flex items-center gap-sm w-full text-left transition-all active:opacity-95 border-l-2 ${
            activeTab === "account"
              ? `bg-surface-container-highest text-on-surface ${currentAccent.border}`
              : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
          }`}
        >
          <SettingsIcon className="w-[18px] h-[18px]" />
          Account
        </button>
        <button
          onClick={() => handleTabClick("preferences")}
          className={`px-md py-sm rounded-md font-medium flex items-center gap-sm w-full text-left transition-all active:opacity-95 border-l-2 ${
            activeTab === "preferences"
              ? `bg-surface-container-highest text-on-surface ${currentAccent.border}`
              : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
          }`}
        >
          <Sliders className="w-[18px] h-[18px]" />
          Preferences
        </button>
      </aside>

      {/* Right Side Settings Panel Container */}
      <div className="flex-1">
        {loadingDb ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-xl flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
            {/* Header */}
            <div className="px-xl py-lg border-b border-outline-variant bg-surface-bright">
              <h2 className="font-headline-md text-headline-md text-on-surface capitalize">
                {activeTab} Settings
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {activeTab === "profile" && "Manage your public profile description, avatar, and system identity."}
                {activeTab === "appearance" && "Customize your visual builder theme, accent color, and canvas details."}
                {activeTab === "account" && "Update passwords, review active web session data, or delete your account."}
                {activeTab === "preferences" && "Manage automatic triggers, notifications, editor zooms, and shortcuts."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAll} className="p-xl flex flex-col gap-xl">
              {renderTabContent()}

              {/* Actions Footer */}
              <div className="border-t border-outline-variant pt-lg flex justify-end gap-md items-center w-full">
                {isDirty && (
                  <span className="text-xs text-amber-600 dark:text-amber-500 font-medium mr-auto flex items-center gap-1 select-none">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Unsaved changes
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  disabled={!isDirty || saving}
                  className="px-lg py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-body-md text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed select-none"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving || (activeTab !== "account" && !isDirty)}
                  className={`px-lg py-sm rounded-md font-body-md text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-2 flex items-center gap-sm select-none active:scale-95 ${
                    saving || (activeTab !== "account" && !isDirty)
                      ? "bg-surface-container-high border border-outline-variant text-on-surface-variant opacity-50 cursor-not-allowed"
                      : `${currentAccent.primary} text-white`
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-[18px] h-[18px]" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>

      {/* Unsaved Changes Tab Switch Alert Warning Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl max-w-md w-full p-lg flex flex-col gap-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-md text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-body-lg font-bold text-on-surface">Unsaved Changes</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              You have unsaved changes in your settings form. Switching sections will discard these changes. Are you sure you want to proceed?
            </p>
            <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setPendingTabSwitch(null);
                  setPendingNavigationUrl(null);
                }}
                className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-medium text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={confirmTabSwitch}
                className="px-md py-sm bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Danger Zone Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl max-w-md w-full p-lg flex flex-col gap-md animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-md text-red-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h4 className="font-body-lg font-bold text-on-surface">Delete Account Permanently?</h4>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              This action is irreversible and deletes your account, login details, workflows, and executions.
            </p>
            
            <div className="flex flex-col gap-sm pt-xs">
              <label className="text-xs font-semibold text-on-surface">
                To confirm, type <span className="font-mono bg-surface-container-high px-1 rounded text-red-600">DELETE</span> below:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                className="w-full px-md py-sm border border-red-300 dark:border-red-900 bg-surface-container-lowest rounded-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-red-600 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-sm pt-xs">
              <label className="text-xs font-semibold text-on-surface">
                To confirm, type your active email <span className="font-mono bg-surface-container-high px-1 rounded text-red-600">{session?.user?.email}</span> below:
              </label>
              <input
                type="email"
                placeholder={session?.user?.email || "Email"}
                value={deleteEmailConfirmation}
                onChange={(e) => setDeleteEmailConfirmation(e.target.value)}
                className="w-full px-md py-sm border border-red-300 dark:border-red-900 bg-surface-container-lowest rounded-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-red-600 transition-shadow"
              />
            </div>

            <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText("");
                  setDeleteEmailConfirmation("");
                }}
                className="px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-md font-medium text-sm text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== "DELETE" || deleteEmailConfirmation !== session?.user?.email || deleting}
                className="px-md py-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors flex items-center gap-sm"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
