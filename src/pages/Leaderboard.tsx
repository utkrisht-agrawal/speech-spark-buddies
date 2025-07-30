import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Star, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name?: string;
  score: number;
  rank: number;
}

interface DailyLeaderboardEntry extends LeaderboardEntry {
  exercises_completed: number;
  avg_accuracy: number;
}

interface LevelLeaderboardEntry extends LeaderboardEntry {
  level: number;
  total_xp: number;
}

const Leaderboard = () => {
  const [dailyLeaderboard, setDailyLeaderboard] = useState<DailyLeaderboardEntry[]>([]);
  const [levelLeaderboard, setLevelLeaderboard] = useState<LevelLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily leaderboard - today's practice scores
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData, error: dailyError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          accuracy,
          xp_earned,
          profiles!inner(username, full_name)
        `)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (dailyError) {
        console.error('Error fetching daily leaderboard:', dailyError);
        toast.error('Failed to load daily leaderboard');
      } else {
        // Process daily data
        const dailyProcessed = processDailyData(dailyData || []);
        setDailyLeaderboard(dailyProcessed);
      }

      // Fetch level leaderboard - overall rankings
      const { data: levelData, error: levelError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, current_level, total_xp')
        .not('current_level', 'is', null)
        .order('total_xp', { ascending: false })
        .limit(50);

      if (levelError) {
        console.error('Error fetching level leaderboard:', levelError);
        toast.error('Failed to load level leaderboard');
      } else {
        // Process level data
        const levelProcessed = (levelData || []).map((entry, index) => ({
          user_id: entry.user_id,
          username: entry.username,
          full_name: entry.full_name,
          score: entry.total_xp,
          rank: index + 1,
          level: entry.current_level,
          total_xp: entry.total_xp
        }));
        setLevelLeaderboard(levelProcessed);
      }
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  const processDailyData = (data: any[]) => {
    // Group by user and calculate stats
    const userStats = data.reduce((acc, record) => {
      const userId = record.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          username: record.profiles.username,
          full_name: record.profiles.full_name,
          totalAccuracy: 0,
          totalXP: 0,
          exerciseCount: 0
        };
      }
      acc[userId].totalAccuracy += record.accuracy;
      acc[userId].totalXP += record.xp_earned;
      acc[userId].exerciseCount += 1;
      return acc;
    }, {});

    // Convert to array and calculate averages
    const processed = Object.values(userStats).map((stats: any) => ({
      user_id: stats.user_id,
      username: stats.username,
      full_name: stats.full_name,
      score: stats.totalXP,
      exercises_completed: stats.exerciseCount,
      avg_accuracy: Math.round(stats.totalAccuracy / stats.exerciseCount),
      rank: 0
    }));

    // Sort by total XP and assign ranks
    processed.sort((a, b) => b.score - a.score);
    processed.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return processed;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderLeaderboardEntry = (entry: any, type: 'daily' | 'level') => (
    <div
      key={entry.user_id}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
        entry.rank <= 3 ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
          {getRankIcon(entry.rank)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">
            {entry.full_name || entry.username}
          </h3>
          <p className="text-sm text-gray-600">@{entry.username}</p>
          {type === 'daily' && (
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {entry.exercises_completed} exercises
              </Badge>
              <Badge variant="outline" className="text-xs">
                {entry.avg_accuracy}% accuracy
              </Badge>
            </div>
          )}
          {type === 'level' && (
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                Level {entry.level}
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <Badge className={`px-3 py-1 ${getRankBadgeColor(entry.rank)}`}>
          #{entry.rank}
        </Badge>
        <div className="mt-2">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-lg">{entry.score}</span>
          </div>
          <p className="text-xs text-gray-500">
            {type === 'daily' ? 'Daily XP' : 'Total XP'}
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Leaderboard</h1>
            <p className="text-gray-600">Loading rankings...</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
          </div>
          <p className="text-gray-600">See how you rank against other students</p>
        </div>

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="daily" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Daily Practice</span>
            </TabsTrigger>
            <TabsTrigger value="level" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Overall Levels</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span>Today's Practice Leaders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyLeaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No practice completed today yet!</p>
                    <p className="text-sm text-gray-400">Complete exercises to appear on the leaderboard</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dailyLeaderboard.map(entry => renderLeaderboardEntry(entry, 'daily'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="level">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  <span>Level Champions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {levelLeaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students enrolled yet!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {levelLeaderboard.map(entry => renderLeaderboardEntry(entry, 'level'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;