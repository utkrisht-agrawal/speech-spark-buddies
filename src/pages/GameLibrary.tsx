import React, { useState } from 'react';
import { Play, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Game {
  id: string;
  title: string;
  description: string;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  thumbnail: string;
  color: string;
}

interface GameLibraryProps {
  onPlayGame: (gameId: string) => void;
}

const GameLibrary: React.FC<GameLibraryProps> = ({ onPlayGame }) => {
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [fullscreenGame, setFullscreenGame] = useState<string | null>(null);

  const games: Game[] = [
    // Level 1 Games
    {
      id: 'candle-blow',
      title: 'Candle Blow Adventure',
      description: 'Blow out candles by making breath sounds',
      level: 1,
      difficulty: 'easy',
      category: 'Breathing',
      thumbnail: 'photo-1500375592092-40eb2168fd21',
      color: 'from-orange-400 to-red-500'
    },
    {
      id: 'pop-balloon',
      title: 'Pop the Balloon',
      description: 'Pop colorful balloons with your voice',
      level: 1,
      difficulty: 'easy',
      category: 'Voice Control',
      thumbnail: 'photo-1487058792275-0ad4aaf24ca7',
      color: 'from-pink-400 to-purple-500'
    },
    {
      id: 'feed-monster',
      title: 'Feed the Monster',
      description: 'Help hungry monsters by speaking loudly',
      level: 1,
      difficulty: 'easy',
      category: 'Volume Control',
      thumbnail: 'photo-1526374965328-7f61d4dc18c5',
      color: 'from-green-400 to-blue-500'
    },
    
    // Level 2 Games
    {
      id: 'phoneme-race',
      title: 'Phoneme Race',
      description: 'Race through phoneme challenges',
      level: 2,
      difficulty: 'medium',
      category: 'Pronunciation',
      thumbnail: 'photo-1605810230434-7631ac76ec81',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      id: 'sniff-snail',
      title: 'Sniff Snail Adventure',
      description: 'Help snails collect flowers with nasal sounds',
      level: 2,
      difficulty: 'medium',
      category: 'Nasal Sounds',
      thumbnail: 'photo-1500673922987-e212871fec22',
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'say-build',
      title: 'Say It to Build It',
      description: 'Build structures by speaking words',
      level: 2,
      difficulty: 'medium',
      category: 'Word Practice',
      thumbnail: 'photo-1470813740244-df37b8c1edcb',
      color: 'from-yellow-400 to-orange-500'
    },
    
    // Level 3 Games
    {
      id: 'word-puzzles',
      title: 'Word Puzzles',
      description: 'Solve word puzzles with speech',
      level: 3,
      difficulty: 'hard',
      category: 'Vocabulary',
      thumbnail: 'photo-1526374965328-7f61d4dc18c5',
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'guess-object',
      title: 'Guess the Object',
      description: 'Identify objects using voice clues',
      level: 3,
      difficulty: 'hard',
      category: 'Recognition',
      thumbnail: 'photo-1487058792275-0ad4aaf24ca7',
      color: 'from-indigo-400 to-purple-500'
    },
    {
      id: 'color-right',
      title: 'Color It Right',
      description: 'Paint objects by speaking colors',
      level: 3,
      difficulty: 'hard',
      category: 'Color Learning',
      thumbnail: 'photo-1605810230434-7631ac76ec81',
      color: 'from-red-400 to-pink-500'
    },
    
    // Level 4 Games
    {
      id: 'build-sentence',
      title: 'Build the Sentence',
      description: 'Construct sentences word by word',
      level: 4,
      difficulty: 'hard',
      category: 'Grammar',
      thumbnail: 'photo-1500673922987-e212871fec22',
      color: 'from-cyan-400 to-blue-500'
    },
    {
      id: 'bubble-speech',
      title: 'Bubble Speech',
      description: 'Practice speaking with bubble effects',
      level: 4,
      difficulty: 'hard',
      category: 'Speech Flow',
      thumbnail: 'photo-1470813740244-df37b8c1edcb',
      color: 'from-teal-400 to-cyan-500'
    },
    {
      id: 'connect-sentence',
      title: 'Connect the Sentence',
      description: 'Link sentence parts together',
      level: 4,
      difficulty: 'hard',
      category: 'Sentence Building',
      thumbnail: 'photo-1500375592092-40eb2168fd21',
      color: 'from-lime-400 to-green-500'
    },
    
    // Level 5 Games
    {
      id: 'emotion-match',
      title: 'Emotion Match',
      description: 'Express emotions through voice',
      level: 5,
      difficulty: 'hard',
      category: 'Emotional Expression',
      thumbnail: 'photo-1526374965328-7f61d4dc18c5',
      color: 'from-rose-400 to-red-500'
    },
    {
      id: 'role-play',
      title: 'Role Play Room',
      description: 'Practice conversations in different scenarios',
      level: 5,
      difficulty: 'hard',
      category: 'Conversation',
      thumbnail: 'photo-1487058792275-0ad4aaf24ca7',
      color: 'from-violet-400 to-purple-500'
    },
    {
      id: 'choose-dialog',
      title: 'Choose Your Dialog',
      description: 'Make conversation choices and speak responses',
      level: 5,
      difficulty: 'hard',
      category: 'Dialog Practice',
      thumbnail: 'photo-1605810230434-7631ac76ec81',
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'story-spinner',
      title: 'Story Spinner',
      description: 'Create and tell stories with random elements',
      level: 5,
      difficulty: 'hard',
      category: 'Storytelling',
      thumbnail: 'photo-1500673922987-e212871fec22',
      color: 'from-emerald-400 to-green-500'
    },
    {
      id: 'comic-strip',
      title: 'Speak Your Comic Strip',
      description: 'Read comic panels aloud with expression',
      level: 5,
      difficulty: 'hard',
      category: 'Reading Aloud',
      thumbnail: 'photo-1470813740244-df37b8c1edcb',
      color: 'from-sky-400 to-blue-500'
    }
  ];

  const filteredGames = selectedLevel === 'all' 
    ? games 
    : games.filter(game => game.level === selectedLevel);

  const levels = [1, 2, 3, 4, 5];
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePlayGame = (gameId: string) => {
    setFullscreenGame(gameId);
    onPlayGame(gameId);
  };

  const handleFullscreen = (gameId: string) => {
    setFullscreenGame(gameId);
    document.documentElement.requestFullscreen?.();
  };

  const handleExitFullscreen = () => {
    setFullscreenGame(null);
    document.exitFullscreen?.();
  };

  // Listen for ESC key to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenGame) {
        handleExitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenGame]);

  if (fullscreenGame) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={handleExitFullscreen}
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Fullscreen (ESC)
          </Button>
        </div>
        <div className="flex-1">
          {/* Game content would be rendered here */}
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">
                {games.find(g => g.id === fullscreenGame)?.title}
              </h2>
              <p className="text-lg opacity-80 mb-8">
                Game would load in fullscreen mode here
              </p>
              <Button onClick={handleExitFullscreen} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Exit Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🎮 Game Library</h1>
          <p className="text-gray-600">Choose your level and start playing!</p>
        </div>
      </div>

      {/* Level Filter */}
      <div className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedLevel === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedLevel('all')}
            className="rounded-full"
          >
            All Levels
          </Button>
          {levels.map(level => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLevel(level)}
              className="rounded-full"
            >
              Level {level}
            </Button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <Card key={game.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className={cn(
                "relative h-32 bg-gradient-to-br",
                game.color,
                "flex items-center justify-center"
              )}>
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20"
                  style={{
                    backgroundImage: `url(https://images.unsplash.com/${game.thumbnail}?auto=format&fit=crop&w=400&q=80)`
                  }}
                />
                <div className="relative z-10 text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <Badge variant="secondary" className="text-xs">
                    Level {game.level}
                  </Badge>
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePlayGame(game.id)}
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button
                      onClick={() => handleFullscreen(game.id)}
                      size="sm"
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                    {game.title}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs ml-2", getDifficultyColor(game.difficulty))}
                  >
                    {game.difficulty}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                  {game.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {game.category}
                  </Badge>
                  
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handlePlayGame(game.id)}
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No games found</h3>
            <p className="text-gray-500">Try selecting a different level</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLibrary;