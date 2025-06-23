
import React from 'react';
import { User, Calendar, TrendingUp, Clock, Award, Settings, LogOut } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';

interface ParentDashboardProps {
  parentData: any;
  onLogout: () => void;
}

const ParentDashboard = ({ parentData, onLogout }: ParentDashboardProps) => {
  // Mock data - in real app this would come from API
  const childrenData = [
    {
      id: 1,
      name: 'Emma',
      age: 7,
      totalSessions: 45,
      weeklyProgress: 85,
      lastSession: '2 hours ago',
      difficultWords: ['butterfly', 'elephant', 'beautiful'],
      strengths: ['Animals', 'Colors'],
      avatar: '👧'
    },
    {
      id: 2,
      name: 'Alex',
      age: 9,
      totalSessions: 62,
      weeklyProgress: 92,
      lastSession: '1 day ago',
      difficultWords: ['pronunciation', 'magnificent'],
      strengths: ['Family', 'Emotions'],
      avatar: '👦'
    }
  ];

  const recentActivities = [
    { child: 'Emma', activity: 'Completed Animals category', time: '2 hours ago', score: 78 },
    { child: 'Alex', activity: 'Practiced difficult words', time: '1 day ago', score: 85 },
    { child: 'Emma', activity: 'Earned "Word Warrior" badge', time: '2 days ago', score: null },
    { child: 'Alex', activity: 'Completed Colors category', time: '3 days ago', score: 91 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
            <p className="text-gray-600">Welcome back, {parentData.name}!</p>
          </div>
          <div className="flex items-center space-x-4">
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
        {/* Children Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Children</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {childrenData.map((child) => (
              <div key={child.id} className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{child.avatar}</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                    <p className="text-gray-600">Age {child.age} • {child.totalSessions} sessions</p>
                  </div>
                </div>

                <div className="mb-4">
                  <ProgressBar
                    current={child.weeklyProgress}
                    max={100}
                    label="Weekly Progress"
                    color="green"
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-2xl p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">Last Session</span>
                    </div>
                    <p className="text-sm text-blue-600">{child.lastSession}</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Award className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Strengths</span>
                    </div>
                    <p className="text-sm text-purple-600">{child.strengths.join(', ')}</p>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-2xl p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Needs Practice:</h4>
                  <p className="text-sm text-orange-600">{child.difficultWords.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-gray-50">
                  <div className="text-2xl">
                    {activity.child === 'Emma' ? '👧' : '👦'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.child}</p>
                    <p className="text-sm text-gray-600">{activity.activity}</p>
                  </div>
                  <div className="text-right">
                    {activity.score && (
                      <div className="bg-green-100 text-green-600 px-2 py-1 rounded-lg text-sm font-medium mb-1">
                        {activity.score}%
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">View Reports</p>
            </button>
            <button className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Schedule Session</p>
            </button>
            <button className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <User className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Contact Therapist</p>
            </button>
            <button className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <Settings className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">App Settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
