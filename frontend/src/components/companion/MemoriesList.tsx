import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ReflectionMemory } from '@/lib/companion/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  Calendar,
  Sparkles,
  Loader2 
} from 'lucide-react';

interface MemoriesListProps {
  onMemoriesUpdated?: () => void;
}

export function MemoriesList({ onMemoriesUpdated }: MemoriesListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [memories, setMemories] = useState<ReflectionMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Memory Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMemories();
  }, [user]);

  const loadMemories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reflections_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories((data || []) as unknown as ReflectionMemory[]);
    } catch (err) {
      console.error('Error loading reflection memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { data, error } = await supabase
        .from('reflections_memories')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category: 'reflection',
          tags,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Memory Saved!',
        description: 'Your reflection is now part of your permanent context bank.',
      });

      setTitle('');
      setContent('');
      setTagInput('');
      setIsOpen(false);
      loadMemories();
      onMemoriesUpdated?.();
    } catch (err) {
      console.error('Error saving memory:', err);
      toast({
        title: 'Save failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id?: string) => {
    if (!id || !user) return;
    try {
      const { error } = await supabase.from('reflections_memories').delete().eq('id', id);
      if (error) throw error;

      toast({
        title: 'Memory Deleted',
        description: 'The reflection was removed.',
      });

      setMemories((prev) => prev.filter((m) => m.id !== id));
      onMemoriesUpdated?.();
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const filteredMemories = memories.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      (m.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections, insights, or tags..."
            className="pl-9 text-sm bg-white border-gray-200"
          />
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Reflection Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reflection Memory</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMemory} className="space-y-4 py-2">
              <div>
                <Label htmlFor="memTitle" className="text-xs">Title / Theme</Label>
                <Input
                  id="memTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Breakthrough in Vocal Pacing"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="memContent" className="text-xs">Reflection Content</Label>
                <Textarea
                  id="memContent"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What key realization or speech practice lesson occurred?"
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="memTags" className="text-xs">Tags (comma separated)</Label>
                <Input
                  id="memTags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="confidence, pacing, presentation"
                  className="mt-1"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !content.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? 'Saving...' : 'Save Reflection'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Memories Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm text-gray-500">Loading reflection memory bank...</p>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-200">
          <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">No reflection memories found</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Pin key insights directly from your AI Coach chat sessions or add a custom note here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((memory) => (
            <Card key={memory.id} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold text-gray-900">
                    {memory.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {memory.created_at
                        ? new Date(memory.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                  title="Delete memory"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {memory.content}
                </p>

                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-100">
                    {memory.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
