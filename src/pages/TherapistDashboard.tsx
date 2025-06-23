
import React, { useState } from 'react';
import { Users, Calendar, FileText, TrendingUp, Bell, Settings, LogOut, Plus } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';

interface TherapistDashboardProps {
  therapistData: any;
  onLogout: () => void;
}

const TherapistDashboard = ({ therapistData, onLogout }: TherapistDashboardProps) => {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);

  // Mock data - in real app this would come from API
  const patients = [
    {
      id: 1,
      name: 'Emma Johnson',
      age: 7,
      parentEmail: 'mom.johnson@email.com',
      totalSessions: 45,
      weeklyProgress: 78,
      lastSession: '2024-01-15',
      currentGoals: ['Improve consonant clarity', 'Practice multi-syllable words'],
      nextAppointment: '2024-01-20',
      avatar: '👧',
      recentScores: [65, 70, 75, 78, 82]
    },
    {
      id: 2,
      name: 'Alex Chen',
      age: 9,
      parentEmail: 'parent.chen@email.com',
      totalSessions: 62,
      weeklyProgress: 85,
      lastSession: '2024-01-14',
      currentGoals: ['Vowel pronunciation', 'Sentence fluency'],
      nextAppointment: '2024-01-19',
      avatar: '👦',
      recentScores: [70, 75, 80, 85, 88]
    },
    {
      id: 3,
      name: 'Sofia Rodriguez',
      age: 6,
      parentEmail: 'sofia.parent@email.com',
      totalSessions: 28,
      weeklyProgress: 92,
      lastSession: '2024-01-16',
      currentGoals: ['Initial sound practice', 'Word ending clarity'],
      nextAppointment: '2024-01-21',
      avatar: '👧🏽',
      recentScores: [60, 68, 75, 85, 92]
    }
  ];

  const todayAppointments = [
    { time: '10:00 AM', patient: 'Emma Johnson', type: 'Regular Session' },
    { time: '2:00 PM', patient: 'Alex Chen', type: 'Progress Review' },
    { time: '4:00 PM', patient: 'Sofia Rodriguez', type: 'Assessment' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-cyan-50 to-blue-50 pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Speech Therapist Dashboard</h1>
            <p className="text-gray-600">Welcome, Dr. {therapistData.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Settings className="w-6 h-6" />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
                <p className="text-sm text-gray-600">Active Patients</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{todayAppointments.length}</p>
                <p className="text-sm text-gray-600">Today's Sessions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">85%</p>
                <p className="text-sm text-gray-600">Avg Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">12</p>
                <p className="text-sm text-gray-600">Reports Due</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Patient Overview</h2>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Patient</span>
              </button>
            </div>
            <div className="space-y-4">
              {patients.map((patient) => (
                <div 
                  key={patient.id} 
                  className={cn(
                    "bg-white rounded-3xl p-6 shadow-lg border cursor-pointer transition-all duration-200",
                    selectedPatient === patient.id 
                      ? "border-indigo-300 shadow-xl" 
                      : "border-gray-100 hover:shadow-xl"
                  )}
                  onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-4xl">{patient.avatar}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{patient.name}</h3>
                      <p className="text-gray-600">Age {patient.age} • {patient.totalSessions} sessions</p>
                      <p className="text-sm text-gray-500">{patient.parentEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-sm font-medium mb-1">
                        {patient.weeklyProgress}%
                      </div>
                      <p className="text-xs text-gray-500">This Week</p>
                    </div>
                  </div>

                  {selectedPatient === patient.id && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Current Goals:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {patient.currentGoals.map((goal, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-indigo-400">•</span>
                                <span>{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Progress Trend:</h4>
                          <div className="flex items-end space-x-1 h-16">
                            {patient.recentScores.map((score, index) => (
                              <div
                                key={index}
                                className="bg-indigo-400 rounded-t flex-1"
                                style={{ height: `${(score / 100) * 100}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button className="bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-sm hover:bg-indigo-200 transition-colors">
                          View Details
                        </button>
                        <button className="bg-green-100 text-green-600 px-4 py-2 rounded-xl text-sm hover:bg-green-200 transition-colors">
                          Schedule Session
                        </button>
                        <button className="bg-purple-100 text-purple-600 px-4 py-2 rounded-xl text-sm hover:bg-purple-200 transition-colors">
                          Send Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Schedule</h2>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <div className="space-y-4">
                {todayAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-2xl bg-gray-50">
                    <div className="text-indigo-600 font-bold text-sm min-w-[80px]">
                      {appointment.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{appointment.patient}</p>
                      <p className="text-sm text-gray-600">{appointment.type}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 bg-indigo-50 text-indigo-600 py-3 rounded-2xl hover:bg-indigo-100 transition-colors">
                View Full Calendar
              </button>
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow text-left">
                  <FileText className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="font-medium text-gray-800">Create Report</p>
                  <p className="text-sm text-gray-600">Generate progress report</p>
                </button>
                <button className="w-full bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow text-left">
                  <Users className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-800">Parent Communication</p>
                  <p className="text-sm text-gray-600">Send updates to parents</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistDashboard;
