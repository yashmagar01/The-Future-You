import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserContext } from '@/lib/companion/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Target, Anchor, Plus, X, Sparkles, Save, Loader2 } from 'lucide-react';

interface GoalsAndAnchorsProps {
  context: UserContext;
  onUpdated?: () => void;
}

export function GoalsAndAnchors({ context, onUpdated }: GoalsAndAnchorsProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [goals, setGoals] = useState<string[]>(context.goals || []);
  const [anchors, setAnchors] = useState<string[]>(context.anchors || []);
  const [bio, setBio] = useState<string>(context.bio || '');

  const [newGoal, setNewGoal] = useState('');
  const [newAnchor, setNewAnchor] = useState('');
  const [saving, setSaving] = useState(false);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    if (goals.includes(newGoal.trim())) return;
    setGoals([...goals, newGoal.trim()]);
    setNewGoal('');
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const addAnchor = () => {
    if (!newAnchor.trim()) return;
    if (anchors.includes(newAnchor.trim())) return;
    setAnchors([...anchors, newAnchor.trim()]);
    setNewAnchor('');
  };

  const removeAnchor = (index: number) => {
    setAnchors(anchors.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          goals,
          anchors,
          bio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Context Updated! ✨',
        description: 'Your AI companion now reflects your latest goals and anchors.',
      });

      onUpdated?.();
    } catch (err) {
      console.error('Error saving goals & anchors:', err);
      toast({
        title: 'Save Failed',
        description: 'Could not update profile in Supabase.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Personal Context Engine</h4>
            <p className="text-xs text-gray-600">
              These goals and anchors guide your AI companion&apos;s personalized reflection prompts and feedback.
            </p>
          </div>
        </div>

        <Button
          onClick={saveAll}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Goals Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <Target className="h-5 w-5 text-emerald-600" />
              Speaking & Growth Goals
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              What specific communication outcomes or milestones are you working toward?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="e.g., Speak fluently without filler words"
                className="text-sm"
              />
              <Button
                type="button"
                onClick={addGoal}
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {goals.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No goals added yet.</p>
              ) : (
                goals.map((goal, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    <span>{goal}</span>
                    <button
                      onClick={() => removeGoal(index)}
                      className="text-emerald-700 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grounding Anchors Card */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <Anchor className="h-5 w-5 text-teal-600" />
              Grounding Anchors & Core Values
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              The fundamental principles or daily anchors that keep you steady under pressure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAnchor}
                onChange={(e) => setNewAnchor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAnchor())}
                placeholder="e.g., Deep calm breath before speaking"
                className="text-sm"
              />
              <Button
                type="button"
                onClick={addAnchor}
                variant="outline"
                className="border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {anchors.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No grounding anchors added yet.</p>
              ) : (
                anchors.map((anchor, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-900 px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    <span>{anchor}</span>
                    <button
                      onClick={() => removeAnchor(index)}
                      className="text-teal-700 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Bio Statement Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            Personal Reflection & Growth Vision
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            A short statement about the person you are evolving into through this reflection journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g., I am dedicated to mastering clear, confident technical leadership and authentic communication in high-stakes environments."
            rows={3}
            className="text-sm bg-gray-50 focus:bg-white"
          />
        </CardContent>
      </Card>
    </div>
  );
}
