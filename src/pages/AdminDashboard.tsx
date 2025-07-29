import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, BookOpen, BarChart3 } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: 'child' | 'parent' | 'therapist' | 'admin';
  full_name?: string;
}

interface Assignment {
  id: string;
  student_id: string;
  therapist_id?: string;
  parent_id?: string;
  student_name: string;
  assigned_name: string;
  assigned_at: string;
  is_active: boolean;
}

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [therapistAssignments, setTherapistAssignments] = useState<Assignment[]>([]);
  const [parentAssignments, setParentAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('username');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load therapist assignments
      const { data: therapistData, error: therapistError } = await supabase
        .from('student_therapist_assignments')
        .select(`
          id,
          student_id,
          therapist_id,
          assigned_at,
          is_active,
          student:student_id(username, full_name),
          therapist:therapist_id(username, full_name)
        `)
        .eq('is_active', true);

      if (therapistError) throw therapistError;
      
      const formattedTherapistAssignments = (therapistData || []).map(assignment => ({
        id: assignment.id,
        student_id: assignment.student_id,
        therapist_id: assignment.therapist_id,
        student_name: (assignment.student as any)?.full_name || (assignment.student as any)?.username || 'Unknown',
        assigned_name: (assignment.therapist as any)?.full_name || (assignment.therapist as any)?.username || 'Unknown',
        assigned_at: assignment.assigned_at,
        is_active: assignment.is_active
      }));
      setTherapistAssignments(formattedTherapistAssignments);

      // Load parent assignments
      const { data: parentData, error: parentError } = await supabase
        .from('student_parent_assignments')
        .select(`
          id,
          student_id,
          parent_id,
          assigned_at,
          is_active,
          student:student_id(username, full_name),
          parent:parent_id(username, full_name)
        `)
        .eq('is_active', true);

      if (parentError) throw parentError;
      
      const formattedParentAssignments = (parentData || []).map(assignment => ({
        id: assignment.id,
        student_id: assignment.student_id,
        parent_id: assignment.parent_id,
        student_name: (assignment.student as any)?.full_name || (assignment.student as any)?.username || 'Unknown',
        assigned_name: (assignment.parent as any)?.full_name || (assignment.parent as any)?.username || 'Unknown',
        assigned_at: assignment.assigned_at,
        is_active: assignment.is_active
      }));
      setParentAssignments(formattedParentAssignments);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignStudentToTherapist = async () => {
    if (!selectedStudent || !selectedTherapist) {
      toast({
        title: "Error",
        description: "Please select both student and therapist",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_therapist_assignments')
        .insert({
          student_id: selectedStudent,
          therapist_id: selectedTherapist,
          assigned_by: profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student assigned to therapist successfully"
      });

      setSelectedStudent('');
      setSelectedTherapist('');
      loadData();
    } catch (error) {
      console.error('Error assigning student to therapist:', error);
      toast({
        title: "Error",
        description: "Failed to assign student to therapist",
        variant: "destructive"
      });
    }
  };

  const assignStudentToParent = async () => {
    if (!selectedStudent || !selectedParent) {
      toast({
        title: "Error",
        description: "Please select both student and parent",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('student_parent_assignments')
        .insert({
          student_id: selectedStudent,
          parent_id: selectedParent,
          assigned_by: profile?.user_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student assigned to parent successfully"
      });

      setSelectedStudent('');
      setSelectedParent('');
      loadData();
    } catch (error) {
      console.error('Error assigning student to parent:', error);
      toast({
        title: "Error",
        description: "Failed to assign student to parent",
        variant: "destructive"
      });
    }
  };

  const removeAssignment = async (assignmentId: string, type: 'therapist' | 'parent') => {
    try {
      const table = type === 'therapist' ? 'student_therapist_assignments' : 'student_parent_assignments';
      const { error } = await supabase
        .from(table)
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove assignment",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const students = profiles.filter(p => p.role === 'child');
  const therapists = profiles.filter(p => p.role === 'therapist');
  const parents = profiles.filter(p => p.role === 'parent');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage student-therapist and student-parent assignments</p>
          </div>
          <Button onClick={onLogout} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{therapists.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{therapistAssignments.length + parentAssignments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assign Student to Therapist */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Student to Therapist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.full_name || student.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Therapist</label>
                <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {therapists.map(therapist => (
                      <SelectItem key={therapist.user_id} value={therapist.user_id}>
                        {therapist.full_name || therapist.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={assignStudentToTherapist} className="w-full">
                Assign to Therapist
              </Button>
            </CardContent>
          </Card>

          {/* Assign Student to Parent */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Student to Parent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.full_name || student.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Parent</label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.user_id} value={parent.user_id}>
                        {parent.full_name || parent.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={assignStudentToParent} className="w-full">
                Assign to Parent
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Current Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Therapist Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Student-Therapist Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {therapistAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.student_name}</p>
                      <p className="text-sm text-gray-600">→ {assignment.assigned_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Active</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAssignment(assignment.id, 'therapist')}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {therapistAssignments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No assignments yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parent Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Student-Parent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {parentAssignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{assignment.student_name}</p>
                      <p className="text-sm text-gray-600">→ {assignment.assigned_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Active</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAssignment(assignment.id, 'parent')}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                {parentAssignments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No assignments yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;