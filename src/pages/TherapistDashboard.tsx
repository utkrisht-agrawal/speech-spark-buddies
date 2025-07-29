import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, BookOpen, Target, BarChart3, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TherapistDashboardProps {
  therapistData: any;
  onLogout: () => void;
}

interface Exercise {
  id?: string;
  type: string;
  title: string;
  instruction: string;
  content: any;
  target_phonemes?: string[];
  difficulty: number;
  points: number;
  required_accuracy: number;
}

interface Student {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  current_level: number;
}

const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ therapistData, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'assign' | 'students' | 'analytics'>('overview');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Exercise creation form state
  const [newExercise, setNewExercise] = useState<Exercise>({
    type: 'phoneme',
    title: '',
    instruction: '',
    content: '',
    difficulty: 1,
    points: 10,
    required_accuracy: 70,
  });

  const [assignmentData, setAssignmentData] = useState({
    exerciseId: '',
    assignmentType: 'individual' as 'daily' | 'level' | 'individual',
    selectedStudents: [] as string[],
    ageGroup: '',
    targetLevel: 1,
  });

  useEffect(() => {
    fetchExercises();
    fetchStudents();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Get current user ID
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.log('No user found in fetchStudents');
        return;
      }
      
      console.log('Fetching assignments for therapist:', userData.user.id);
      
      const { data: assignmentData, error } = await supabase
        .from('student_therapist_assignments')
        .select('*')
        .eq('therapist_id', userData.user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching student assignments:', error);
        return;
      }

      console.log('Found assignments:', assignmentData);

      // Get student details separately
      const studentsData = [];
      for (const assignment of assignmentData || []) {
        console.log('Processing assignment for student:', assignment.student_id);
        
        const { data: studentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, username, full_name, current_level')
          .eq('user_id', assignment.student_id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching student profile:', profileError);
          continue;
        }

        console.log('Found student profile:', studentProfile);

        if (studentProfile) {
          studentsData.push({
            id: studentProfile.id,
            user_id: studentProfile.user_id,
            username: studentProfile.username,
            full_name: studentProfile.full_name || studentProfile.username,
            current_level: studentProfile.current_level || 1
          });
        }
      }

      console.log('Final students data:', studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const createExercise = async () => {
    if (!newExercise.title || !newExercise.instruction || !newExercise.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const contentArray = typeof newExercise.content === 'string' 
        ? newExercise.content.split('\n').filter(line => line.trim())
        : newExercise.content;

      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          ...newExercise,
          created_by: userData.user?.id,
          content: contentArray.length === 1 ? contentArray[0] : contentArray,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exercise created successfully!",
      });

      setNewExercise({
        type: 'phoneme',
        title: '',
        instruction: '',
        content: '',
        difficulty: 1,
        points: 10,
        required_accuracy: 70,
      });

      fetchExercises();
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast({
        title: "Error",
        description: "Failed to create exercise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignExercise = async () => {
    if (!assignmentData.exerciseId) {
      toast({
        title: "Error",
        description: "Please select an exercise",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const assignments = [];

      if (assignmentData.assignmentType === 'individual' && assignmentData.selectedStudents.length > 0) {
        // Assign to specific students
        for (const studentId of assignmentData.selectedStudents) {
          assignments.push({
            exercise_id: assignmentData.exerciseId,
            assigned_to: studentId,
            assignment_type: assignmentData.assignmentType,
          });
        }
      } else {
        // Assign to all students or by age group
        assignments.push({
          exercise_id: assignmentData.exerciseId,
          assigned_to: null,
          assignment_type: assignmentData.assignmentType,
          age_group: assignmentData.ageGroup || 'all',
          target_level: assignmentData.targetLevel,
        });
      }

      const { error } = await supabase
        .from('exercise_assignments')
        .insert(assignments);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exercise assigned successfully!",
      });

      setAssignmentData({
        exerciseId: '',
        assignmentType: 'individual',
        selectedStudents: [],
        ageGroup: '',
        targetLevel: 1,
      });
    } catch (error) {
      console.error('Error assigning exercise:', error);
      toast({
        title: "Error",
        description: "Failed to assign exercise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{students.length}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Created Exercises</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{exercises.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">75%</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateExercise = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create New Exercise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Exercise Type</label>
            <Select value={newExercise.type} onValueChange={(value: any) => setNewExercise({...newExercise, type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phoneme">Phoneme</SelectItem>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="sentence">Sentence</SelectItem>
                <SelectItem value="breathing">Breathing</SelectItem>
                <SelectItem value="game">Game</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={newExercise.difficulty.toString()} onValueChange={(value) => setNewExercise({...newExercise, difficulty: parseInt(value) as 1 | 2 | 3})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Easy</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={newExercise.title}
            onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
            placeholder="Exercise title"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Instructions</label>
          <Textarea
            value={newExercise.instruction}
            onChange={(e) => setNewExercise({...newExercise, instruction: e.target.value})}
            placeholder="Instructions for the student"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Content</label>
          <Textarea
            value={typeof newExercise.content === 'string' ? newExercise.content : newExercise.content.join('\n')}
            onChange={(e) => setNewExercise({...newExercise, content: e.target.value})}
            placeholder="Exercise content (one item per line for multiple items)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Points</label>
            <Input
              type="number"
              value={newExercise.points}
              onChange={(e) => setNewExercise({...newExercise, points: parseInt(e.target.value)})}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Required Accuracy (%)</label>
            <Input
              type="number"
              value={newExercise.required_accuracy}
              onChange={(e) => setNewExercise({...newExercise, required_accuracy: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <Button onClick={createExercise} disabled={loading}>
          {loading ? 'Creating...' : 'Create Exercise'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderAssignExercise = () => (
    <Card>
      <CardHeader>
        <CardTitle>Assign Exercise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Exercise</label>
          <Select value={assignmentData.exerciseId} onValueChange={(value) => setAssignmentData({...assignmentData, exerciseId: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an exercise" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map(exercise => (
                <SelectItem key={exercise.id} value={exercise.id!}>
                  {exercise.title} ({exercise.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Assignment Type</label>
          <Select value={assignmentData.assignmentType} onValueChange={(value: any) => setAssignmentData({...assignmentData, assignmentType: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual Students</SelectItem>
              <SelectItem value="daily">Daily Practice (All)</SelectItem>
              <SelectItem value="level">Level-based</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assignmentData.assignmentType === 'individual' && (
          <div>
            <label className="text-sm font-medium">Select Students</label>
            <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
              {students.map(student => (
                <div key={student.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    checked={assignmentData.selectedStudents.includes(student.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignmentData({
                          ...assignmentData,
                          selectedStudents: [...assignmentData.selectedStudents, student.user_id]
                        });
                      } else {
                        setAssignmentData({
                          ...assignmentData,
                          selectedStudents: assignmentData.selectedStudents.filter(id => id !== student.user_id)
                        });
                      }
                    }}
                  />
                  <span className="text-sm">{student.full_name || student.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={assignExercise} disabled={loading}>
          {loading ? 'Assigning...' : 'Assign Exercise'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderStudents = () => (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Student Management</CardTitle>
        <Button onClick={fetchStudents} variant="outline" size="sm">
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No students assigned yet.</p>
              <p className="text-sm">Ask your admin to assign students to you.</p>
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">{student.full_name || student.username}</h3>
                  <p className="text-sm text-gray-600">Level {student.current_level}</p>
                  <p className="text-xs text-gray-400">ID: {student.user_id}</p>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'create': return renderCreateExercise();
      case 'assign': return renderAssignExercise();
      case 'students': return renderStudents();
      case 'analytics': return <div>Analytics coming soon...</div>;
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Therapist Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Welcome, {therapistData.name}!
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'create', label: 'Create Exercise', icon: Plus },
            { id: 'assign', label: 'Assign', icon: Target },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default TherapistDashboard;