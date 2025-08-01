import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string | null;
  target_level: number | null;
  target_age_group: string | null;
  is_active: boolean;
  created_at: string;
}

const TutorialManager = () => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    target_level: '',
    target_age_group: ''
  });
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTutorials((data as unknown as Tutorial[]) || []);
    } catch (error) {
      console.error('Error fetching tutorials:', error);
      toast({
        title: "Error",
        description: "Failed to load tutorials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.youtube_url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tutorials' as any)
        .insert({
          title: formData.title,
          description: formData.description,
          youtube_url: formData.youtube_url,
          target_level: formData.target_level ? parseInt(formData.target_level) : null,
          target_age_group: formData.target_age_group || null,
          created_by: profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tutorial added successfully",
      });

      setFormData({
        title: '',
        description: '',
        youtube_url: '',
        target_level: '',
        target_age_group: ''
      });
      setShowForm(false);
      fetchTutorials();
    } catch (error) {
      console.error('Error adding tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to add tutorial",
        variant: "destructive",
      });
    }
  };

  const toggleTutorialStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tutorials' as any)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tutorial ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchTutorials();
    } catch (error) {
      console.error('Error updating tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to update tutorial",
        variant: "destructive",
      });
    }
  };

  const deleteTutorial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      const { error } = await supabase
        .from('tutorials' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tutorial deleted successfully",
      });

      fetchTutorials();
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      toast({
        title: "Error",
        description: "Failed to delete tutorial",
        variant: "destructive",
      });
    }
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/placeholder.svg';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading tutorials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tutorial Management</h2>
          <p className="text-gray-600">Add and manage YouTube tutorials for students</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tutorial
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Tutorial</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tutorial title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="youtube_url">YouTube URL *</Label>
                  <Input
                    id="youtube_url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the tutorial"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_level">Target Level</Label>
                  <Select
                    value={formData.target_level}
                    onValueChange={(value) => setFormData({ ...formData, target_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          Level {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="target_age_group">Age Group</Label>
                  <Select
                    value={formData.target_age_group}
                    onValueChange={(value) => setFormData({ ...formData, target_age_group: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="6-8 years">6-8 years</SelectItem>
                      <SelectItem value="9-12 years">9-12 years</SelectItem>
                      <SelectItem value="13+ years">13+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Add Tutorial</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="overflow-hidden">
            <div className="relative aspect-video bg-gray-200">
              <img
                src={getThumbnailUrl(tutorial.youtube_url)}
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={tutorial.is_active ? "default" : "secondary"}>
                  {tutorial.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">
                {tutorial.title}
              </CardTitle>
              <p className="text-sm text-gray-600 line-clamp-3">
                {tutorial.description}
              </p>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  {tutorial.target_level && (
                    <Badge variant="outline">
                      Level {tutorial.target_level}
                    </Badge>
                  )}
                  {tutorial.target_age_group && (
                    <Badge variant="outline">
                      {tutorial.target_age_group}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(tutorial.youtube_url, '_blank')}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant={tutorial.is_active ? "secondary" : "default"}
                  onClick={() => toggleTutorialStatus(tutorial.id, tutorial.is_active)}
                >
                  {tutorial.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTutorial(tutorial.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutorials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tutorials added yet
          </h3>
          <p className="text-gray-600">
            Click "Add Tutorial" to create your first tutorial
          </p>
        </div>
      )}
    </div>
  );
};

export default TutorialManager;