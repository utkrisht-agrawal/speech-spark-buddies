import React, { useState, useEffect } from 'react';
import { User, Calendar, TrendingUp, Clock, Award, Settings, LogOut, BarChart3, Users, Target, Trophy, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ParentDashboardProps {
  parentData: any;
  onLogout: () => void;
}

interface Child {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  current_level: number;
  total_xp: number;
  streak_days: number;
  last_active_date: string;
  therapist_name?: string;
  therapist_id?: string;
}

interface ActivityLog {
  id: string;
  child_name: string;
  exercise_type: string;
  score: number;
  completed_at: string;
  xp_earned: number;
}

interface ProgressDetail {
  child_id: string;
  child_name: string;
  level_id: number;
  level_progress: number;
  completed_exercises: number;
  total_exercises: number;
  average_score: number;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  total_xp: number;
  current_level: number;
  rank: number;
}

const ParentDashboard = ({ parentData, onLogout }: ParentDashboardProps) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [progressDetails, setProgressDetails] = useState<ProgressDetail[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Fetch children assigned to this parent with therapist info
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('student_parent_assignments')
        .select(`
          student_id,
          student:student_id(
            id,
            user_id,
            username,
            full_name,
            current_level,
            total_xp,
            streak_days,
            last_active_date
          )
        `)
        .eq('parent_id', userData.user?.id)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;

      let childrenData = assignmentData?.map(assignment => ({
        id: (assignment.student as any).id,
        user_id: (assignment.student as any).user_id,
        username: (assignment.student as any).username,
        full_name: (assignment.student as any).full_name || (assignment.student as any).username,
        current_level: (assignment.student as any).current_level || 1,
        total_xp: (assignment.student as any).total_xp || 0,
        streak_days: (assignment.student as any).streak_days || 0,
        last_active_date: (assignment.student as any).last_active_date
      })) || [];

      // Fetch therapist assignments for each child
      if (childrenData.length > 0) {
        const childIds = childrenData.map(child => child.user_id);
        
        const { data: therapistData } = await supabase
          .from('student_therapist_assignments')
          .select(`
            student_id,
            therapist:therapist_id(username, full_name)
          `)
          .in('student_id', childIds)
          .eq('is_active', true);

        // Add therapist info to children data
        childrenData = childrenData.map(child => {
          const therapistAssignment = therapistData?.find(t => t.student_id === child.user_id);
          const therapist = therapistAssignment?.therapist as any;
          return {
            ...child,
            therapist_name: therapist?.full_name || therapist?.username || 'No therapist assigned',
            therapist_id: therapist?.id
          };
        });

        // Fetch detailed progress for each child
        const { data: levelProgressData } = await supabase
          .from('level_progress')
          .select('*')
          .in('user_id', childIds);

        const progressDetails = childrenData.map(child => {
          const levelProgress = levelProgressData?.find(lp => lp.user_id === child.user_id && lp.level_id === child.current_level);
          return {
            child_id: child.user_id,
            child_name: child.full_name || child.username,
            level_id: child.current_level,
            level_progress: levelProgress ? (levelProgress.completed_exercises / levelProgress.total_exercises) * 100 : 0,
            completed_exercises: levelProgress?.completed_exercises || 0,
            total_exercises: levelProgress?.total_exercises || 0,
            average_score: Number(levelProgress?.average_score || 0)
          };
        });

        setProgressDetails(progressDetails);

        // Fetch recent activities for assigned children
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            id,
            user_id,
            exercise_type,
            score,
            completed_at,
            xp_earned,
            user:user_id(username, full_name)
          `)
          .in('user_id', childIds)
          .order('completed_at', { ascending: false })
          .limit(20);

        if (progressError) throw progressError;

        const formattedActivities = progressData?.map(activity => ({
          id: activity.id,
          child_name: (activity.user as any)?.full_name || (activity.user as any)?.username || 'Unknown',
          exercise_type: activity.exercise_type,
          score: activity.score,
          completed_at: activity.completed_at,
          xp_earned: activity.xp_earned
        })) || [];

        setActivities(formattedActivities);

        // Fetch leaderboard data for children
        const { data: leaderboardData } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, total_xp, current_level')
          .in('user_id', childIds)
          .order('total_xp', { ascending: false });

        const leaderboardWithRanks = leaderboardData?.map((entry, index) => ({
          ...entry,
          rank: index + 1
        })) || [];

        setLeaderboard(leaderboardWithRanks);
      }

      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading parent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
            <p className="text-gray-600">Welcome back, {parentData.name}!</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.reduce((sum, child) => sum + child.total_xp, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Level</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.length > 0 ? Math.round(children.reduce((sum, child) => sum + child.current_level, 0) / children.length) : 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activities.length}</div>
            </CardContent>
          </Card>
        </div>

        {children.length > 0 ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Children Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => (
                  <Card key={child.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {child.full_name ? child.full_name.charAt(0).toUpperCase() : child.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{child.full_name || child.username}</CardTitle>
                          <p className="text-sm text-gray-600">Level {child.current_level}</p>
                          <p className="text-xs text-gray-500">Therapist: {child.therapist_name}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <Badge variant="secondary">{child.total_xp} XP</Badge>
                      </div>
                      <Progress value={(child.total_xp % 100)} className="w-full" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span>Streak: {child.streak_days} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>Last active: {child.last_active_date ? formatDate(child.last_active_date) : 'Never'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {progressDetails.map((progress) => (
                      <div key={progress.child_id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold">{progress.child_name}</h3>
                          <Badge variant="outline">Level {progress.level_id}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Level Progress</span>
                            <span>{Math.round(progress.level_progress)}%</span>
                          </div>
                          <Progress value={progress.level_progress} className="w-full" />
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Exercises:</span><br/>
                              {progress.completed_exercises}/{progress.total_exercises}
                            </div>
                            <div>
                              <span className="font-medium">Average Score:</span><br/>
                              {Math.round(progress.average_score)}%
                            </div>
                            <div>
                              <span className="font-medium">Performance:</span><br/>
                              <Badge variant={progress.average_score >= 80 ? "default" : progress.average_score >= 60 ? "secondary" : "destructive"}>
                                {progress.average_score >= 80 ? "Excellent" : progress.average_score >= 60 ? "Good" : "Needs Practice"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{activity.child_name}</p>
                              <p className="text-sm text-gray-600">
                                Completed {activity.exercise_type} exercise
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={activity.score >= 80 ? "default" : activity.score >= 60 ? "secondary" : "destructive"}>
                              {activity.score}%
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              +{activity.xp_earned} XP
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(activity.completed_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>No recent activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Children Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-4">
                      {leaderboard.map((entry) => (
                        <div key={entry.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              entry.rank === 1 ? 'bg-yellow-500' :
                              entry.rank === 2 ? 'bg-gray-400' :
                              entry.rank === 3 ? 'bg-amber-600' :
                              'bg-blue-500'
                            }`}>
                              {entry.rank}
                            </div>
                            <div>
                              <p className="font-medium">{entry.full_name || entry.username}</p>
                              <p className="text-sm text-gray-600">Level {entry.current_level}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{entry.total_xp} XP</div>
                            {entry.rank <= 3 && (
                              <Trophy className={`w-4 h-4 inline ${
                                entry.rank === 1 ? 'text-yellow-500' :
                                entry.rank === 2 ? 'text-gray-400' :
                                'text-amber-600'
                              }`} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>No leaderboard data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Children Assigned</h3>
              <p className="text-gray-500">Contact your admin to assign children to your parent account.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;