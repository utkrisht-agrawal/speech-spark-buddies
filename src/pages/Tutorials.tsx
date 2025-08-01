import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowLeft, Maximize } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url: string | null;
  target_level: number | null;
  target_age_group: string | null;
}

interface TutorialsProps {
  onBack: () => void;
}

const Tutorials = ({ onBack }: TutorialsProps) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const { data, error } = await supabase
        .from('tutorials' as any)
        .select('*')
        .eq('is_active', true)
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

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '/placeholder.svg';
  };

  const getEmbedUrl = (youtubeUrl: string) => {
    const videoId = extractVideoId(youtubeUrl);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTutorial) {
        setSelectedTutorial(null);
        if (isFullscreen) {
          document.exitFullscreen?.();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedTutorial, isFullscreen]);

  if (selectedTutorial) {
    return (
      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'min-h-screen bg-gradient-to-br from-purple-50 to-pink-50'} p-4`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={() => setSelectedTutorial(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tutorials
            </Button>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Maximize className="w-4 h-4" />
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
          </div>

          <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'h-[90vh]' : ''}`}>
            <div className={`${isFullscreen ? 'h-full' : 'aspect-video'} relative`}>
              <iframe
                src={getEmbedUrl(selectedTutorial.youtube_url)}
                title={selectedTutorial.title}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            
            {!isFullscreen && (
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedTutorial.title}
                </h1>
                <p className="text-gray-600 mb-4">
                  {selectedTutorial.description}
                </p>
                <div className="flex gap-2">
                  {selectedTutorial.target_level && (
                    <Badge variant="secondary">
                      Level {selectedTutorial.target_level}
                    </Badge>
                  )}
                  {selectedTutorial.target_age_group && (
                    <Badge variant="outline">
                      {selectedTutorial.target_age_group}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tutorials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Learning Tutorials
            </h1>
            <p className="text-gray-600">
              Watch helpful videos to improve your speech skills
            </p>
          </div>
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {tutorials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tutorials available yet
            </h3>
            <p className="text-gray-600">
              Check back later for new learning videos!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video bg-gray-200">
                  <img
                    src={tutorial.thumbnail_url || getThumbnailUrl(tutorial.youtube_url)}
                    alt={tutorial.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => setSelectedTutorial(tutorial)}
                      size="lg"
                      className="rounded-full bg-white text-purple-600 hover:bg-gray-100"
                    >
                      <Play className="w-6 h-6 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {tutorial.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {tutorial.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {tutorial.target_level && (
                        <Badge variant="secondary">
                          Level {tutorial.target_level}
                        </Badge>
                      )}
                      {tutorial.target_age_group && (
                        <Badge variant="outline">
                          {tutorial.target_age_group}
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedTutorial(tutorial)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Play className="w-4 h-4" />
                      Watch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tutorials;