import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Video, Clock, TrendingUp, Edit2, Save, X, Loader2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  
  // Real stats from database (will load from recordings)
  const [stats] = useState({
    totalRecordings: 0,
    hoursRecorded: 0,
    averageScore: 0,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: editedProfile.full_name,
          bio: editedProfile.bio,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Profile saved successfully:', data);

      setProfile(editedProfile);
      setIsEditing(false);
      
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (error: any) {
      console.error('Save error:', error);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const initials = profile.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Hero Section - Authentic, Real Data */}
        <Card className="overflow-hidden border-2 border-border/50 shadow-soft hover-lift">
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white shadow-strong transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                {!isEditing ? (
                  <>
                    <div>
                      <h1 className="text-4xl font-bold text-foreground mb-2">
                        {profile.full_name || 'Complete Your Profile'}
                      </h1>
                      <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                        <User className="h-4 w-4" />
                        {user?.email}
                      </p>
                    </div>
                    {profile.bio && (
                      <p className="text-foreground/80 italic max-w-2xl">
                        "{profile.bio}"
                      </p>
                    )}
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                      size="lg"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 max-w-2xl">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">Full Name</Label>
                      <Input
                        id="edit_name"
                        value={editedProfile.full_name}
                        onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                        placeholder="Your name"
                        className="text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_bio">Bio</Label>
                      <Textarea
                        id="edit_bio"
                        value={editedProfile.bio}
                        onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {editedProfile.bio?.length || 0}/200
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={saving}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Real Statistics - Only show if we have data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift border-border/50 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Recordings</p>
                  <p className="text-4xl font-bold text-primary mt-1">{stats.totalRecordings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Hours Recorded</p>
                  <p className="text-4xl font-bold text-accent mt-1">{stats.hoursRecorded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift border-border/50 transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-success/10 rounded-full">
                  <TrendingUp className="h-8 w-8 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Average Score</p>
                  <p className="text-4xl font-bold text-success mt-1">
                    {stats.averageScore > 0 ? stats.averageScore : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Card - Only show if profile incomplete */}
        {(!profile.full_name || !profile.bio) && !isEditing && (
          <Card className="border-primary/20 bg-primary/5 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary text-primary-foreground">New</Badge>
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Add your name and bio to personalize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
