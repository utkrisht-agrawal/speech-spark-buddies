
import React, { useState } from 'react';
import { User, Heart, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginPageProps {
  onLogin: (userType: 'child' | 'parent' | 'therapist', userData: any) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [selectedUserType, setSelectedUserType] = useState<'child' | 'parent' | 'therapist' | null>(null);
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleChildLogin = () => {
    if (childName.trim()) {
      onLogin('child', { name: childName });
    }
  };

  const handleAdultLogin = (userType: 'parent' | 'therapist') => {
    if (email && password) {
      onLogin(userType, { email, name: email.split('@')[0] });
    }
  };

  if (!selectedUserType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome to VoiceBuddy! 🎤
            </h1>
            <p className="text-gray-600">Choose how you want to continue</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setSelectedUserType('child')}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-6 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-3"
            >
              <User className="w-8 h-8" />
              <span className="text-xl">I'm a Child</span>
            </button>

            <button
              onClick={() => setSelectedUserType('parent')}
              className="w-full bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white font-bold py-6 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Heart className="w-8 h-8" />
              <span className="text-xl">I'm a Parent</span>
            </button>

            <button
              onClick={() => setSelectedUserType('therapist')}
              className="w-full bg-gradient-to-r from-indigo-400 to-cyan-400 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold py-6 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Stethoscope className="w-8 h-8" />
              <span className="text-xl">I'm a Speech Therapist</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedUserType === 'child') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Hi there, buddy!
            </h1>
            <p className="text-gray-600 text-lg">What's your name?</p>
          </div>

          <div className="space-y-6">
            <Input
              type="text"
              placeholder="Type your name here..."
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="text-xl py-4 text-center rounded-2xl border-2"
            />

            <Button
              onClick={handleChildLogin}
              disabled={!childName.trim()}
              className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 text-xl"
            >
              Let's Practice! 🎯
            </Button>

            <button
              onClick={() => setSelectedUserType(null)}
              className="w-full text-gray-500 hover:text-gray-700 py-2"
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            {selectedUserType === 'parent' ? '👨‍👩‍👧‍👦' : '🩺'}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {selectedUserType === 'parent' ? 'Parent Login' : 'Therapist Login'}
          </h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="py-3 rounded-xl"
          />

          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="py-3 rounded-xl"
          />

          <Button
            onClick={() => handleAdultLogin(selectedUserType as 'parent' | 'therapist')}
            disabled={!email || !password}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
          >
            Sign In
          </Button>

          <button
            onClick={() => setSelectedUserType(null)}
            className="w-full text-gray-500 hover:text-gray-700 py-2"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
