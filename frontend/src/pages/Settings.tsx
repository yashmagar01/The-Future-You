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
import { User, Lock, Video, Palette, Bell } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    twoFactor: false,
    profileVisibility: 'private',
    dataSharing: false,
    activityStatus: true,
    videoQuality: '1080p',
    autoSave: true,
    deleteAfterProcessing: false,
    webcamPreview: true,
    theme: 'system',
    accentColor: 'green',
    compactMode: false,
    pushNotifications: true,
    recordingReminders: true,
    insightReady: true,
    weeklySummary: false,
  });

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">Customize your experience</p>
        </div>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              <CardTitle>Account Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email updates about your activity</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-gray-500">Promotional content and news</p>
              </div>
              <Switch
                checked={settings.marketingEmails}
               onCheckedChange={(checked) =>
                  setSettings({ ...settings, marketingEmails: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add extra security layer</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.twoFactor}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, twoFactor: checked })
                  }
                />
                {!settings.twoFactor && (
                  <Button variant="outline" size="sm">Enable →</Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              <CardTitle>Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Profile Visibility</Label>
              <RadioGroup
                value={settings.profileVisibility}
                onValueChange={(value) =>
                  setSettings({ ...settings, profileVisibility: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="font-normal">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="font-normal">Private</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="friends" id="friends" />
                  <Label htmlFor="friends" className="font-normal">Friends Only</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Sharing</Label>
                <p className="text-sm text-gray-500">Share analytics for improvements</p>
              </div>
              <Switch
                checked={settings.dataSharing}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, dataSharing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Activity Status</Label>
                <p className="text-sm text-gray-500">Let others see when you're online</p>
              </div>
              <Switch
                checked={settings.activityStatus}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, activityStatus: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Video Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-green-600" />
              <CardTitle>Video Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default Quality</Label>
              <Select
                value={settings.videoQuality}
                onValueChange={(value) =>
                  setSettings({ ...settings, videoQuality: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p (SD)</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Save Recordings</Label>
                <p className="text-sm text-gray-500">Automatically save after recording</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoSave: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete After Processing</Label>
                <p className="text-sm text-gray-500">Remove original after analysis</p>
              </div>
              <Switch
                checked={settings.deleteAfterProcessing}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, deleteAfterProcessing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Webcam Preview</Label>
                <p className="text-sm text-gray-500">Show preview before recording</p>
              </div>
              <Switch
                checked={settings.webcamPreview}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, webcamPreview: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-green-600" />
              <CardTitle>Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <RadioGroup
                value={settings.theme}
                onValueChange={(value) => setSettings({ ...settings, theme: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="font-normal">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="font-normal">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="font-normal">System</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Accent Color</Label>
              <RadioGroup
                value={settings.accentColor}
                onValueChange={(value) =>
                  setSettings({ ...settings, accentColor: value })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="green" id="green" />
                  <Label htmlFor="green" className="font-normal">Green</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blue" id="blue" />
                  <Label htmlFor="blue" className="font-normal">Blue</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="purple" id="purple" />
                  <Label htmlFor="purple" className="font-normal">Purple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="orange" id="orange" />
                  <Label htmlFor="orange" className="font-normal">Orange</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Compact Mode</Label>
                <p className="text-sm text-gray-500">Reduce spacing and padding</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, compactMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-500">Browser notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, pushNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recording Reminders</Label>
                <p className="text-sm text-gray-500">Daily reminder at 9:00 AM</p>
              </div>
              <Switch
                checked={settings.recordingReminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, recordingReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Insight Ready</Label>
                <p className="text-sm text-gray-500">When analysis completes</p>
              </div>
              <Switch
                checked={settings.insightReady}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, insightReady: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-gray-500">Every Monday morning</p>
              </div>
              <Switch
                checked={settings.weeklySummary}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, weeklySummary: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Footer */}
        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </AppLayout>
  );
}
