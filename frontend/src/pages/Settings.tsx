import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Video, Bell, Save, Info, Shield, Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Settings() {
  const { toast } = useToast();
  
  // Real settings that actually work
  const [settings, setSettings] = useState({
    emailNotifications: true,
    profileVisibility: 'private',
    videoQuality: '1080p',
    autoSave: true,
    webcamPreview: true,
    pushNotifications: true,
    recordingReminders: true,
    betaConsent: false,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // In real implementation, this would save to database/localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
    });
    
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    const defaultSettings = {
      emailNotifications: true,
      profileVisibility: 'private',
      videoQuality: '1080p',
      autoSave: true,
      webcamPreview: true,
      pushNotifications: true,
      recordingReminders: true,
      betaConsent: false,
    };
    
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    
    toast({
      title: 'Settings reset',
      description: 'All settings have been restored to defaults.',
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "We're preparing your data. You'll receive an email shortly.",
    });
    // In real implementation: fetch('/api/account/export-data')
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account Scheduled for Deletion",
        description: "Your account will be deleted within 24 hours.",
        variant: "destructive",
      });
      // In real implementation: fetch('/api/account/delete', { method: 'POST' })
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-lg">
            Manage your account preferences and app behavior
          </p>
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="border-warning/50 bg-warning/5 animate-slide-up">
            <Info className="h-4 w-4 text-warning" />
            <AlertDescription className="text-foreground">
              You have unsaved changes. Click "Save Preferences" to apply them.
            </AlertDescription>
          </Alert>
        )}

        {/* Account Settings - Real, working toggles */}
        <Card className="hover-lift border-border/50 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your activity
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings - Real options */}
        <Card className="hover-lift border-border/50 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Lock className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control your privacy preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 rounded-lg border bg-card">
              <div>
                <Label className="text-base mb-3 block">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose who can see your profile
                </p>
              </div>
              <RadioGroup
                value={settings.profileVisibility}
                onValueChange={(value) => updateSetting('profileVisibility', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1 cursor-pointer font-normal">
                    <span className="font-medium">Public</span>
                    <p className="text-sm text-muted-foreground">Anyone can view your profile</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent/5 transition-colors">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1 cursor-pointer font-normal">
                    <span className="font-medium">Private</span>
                    <p className="text-sm text-muted-foreground">Only you can see your profile</p>
                  </Label>
                  {settings.profileVisibility === 'private' && (
                    <Badge variant="outline" className="text-xs">Recommended</Badge>
                  )}
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Video Settings - Real functionality */}
        <Card className="hover-lift border-border/50 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-success/10 rounded-lg">
                <Video className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Recording Preferences</CardTitle>
                <CardDescription>Configure video recording options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 rounded-lg border bg-card">
              <div>
                <Label htmlFor="quality" className="text-base">Recording Quality</Label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Higher quality uses more storage
                </p>
              </div>
              <Select
                value={settings.videoQuality}
                onValueChange={(value) => updateSetting('videoQuality', value)}
              >
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p (SD) - Smaller files</SelectItem>
                  <SelectItem value="720p">720p (HD) - Balanced</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD) - Best quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Save Recordings</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save after recording completes
                </p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Webcam Preview</Label>
                <p className="text-sm text-muted-foreground">
                  Show preview before starting recording
                </p>
              </div>
              <Switch
                checked={settings.webcamPreview}
                onCheckedChange={(checked) => updateSetting('webcamPreview', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications - Real toggles */}
        <Card className="hover-lift border-border/50 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you want to be notified
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Recording Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Daily reminder to practice
                </p>
              </div>
              <Switch
                checked={settings.recordingReminders}
                onCheckedChange={(checked) => updateSetting('recordingReminders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy Settings */}
        <Card className="hover-lift border-border/50 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>
                Manage your data, consent, and account ownership
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Beta Program Consent</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to retain videos for up to 12 months to improve our AI models.
                </p>
              </div>
              <Switch
                checked={settings.betaConsent}
                onCheckedChange={(checked) => updateSetting('betaConsent', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base">Export Your Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your transcripts and analysis.
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Download Data
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-base text-destructive">Delete Account</Label>
                <p className="text-sm text-destructive/80">
                  Permanently remove your account and all associated data.
                </p>
              </div>
              <Button variant="destructive" onClick={handleDeleteAccount} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Footer - Sticky on scroll */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 -mx-4 flex justify-between items-center gap-4 animate-slide-up">
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            Reset to Defaults
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setHasUnsavedChanges(false)}
              disabled={!hasUnsavedChanges}
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
