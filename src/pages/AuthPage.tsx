import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Mic, Users, UserCheck, ArrowRight, Sparkles, Heart } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'child' | 'parent' | 'therapist'>('child');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(username, password, role, fullName);
        if (error) throw error;
        toast({
          title: "🎉 Welcome to VoiceBuddy!",
          description: "Your account has been created successfully. You can now sign in!",
        });
        setIsSignUp(false);
        setUsername('');
        setPassword('');
        setFullName('');
      } else {
        const { error } = await signIn(username, password);
        if (error) throw error;
        toast({
          title: "🌟 Welcome back!",
          description: "You have successfully signed in to VoiceBuddy!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Oops! Something went wrong",
        description: error.message || "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'child',
      icon: Heart,
      title: 'Young Learner',
      description: 'Start your speech adventure!',
      gradient: 'from-pink-400 to-purple-500'
    },
    {
      value: 'parent',
      icon: Users,
      title: 'Caring Parent',
      description: 'Support your child\'s journey',
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      value: 'therapist',
      icon: UserCheck,
      title: 'Speech Therapist',
      description: 'Professional tools & insights',
      gradient: 'from-green-400 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      {/* Floating elements for visual appeal */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-pink-300 to-purple-400 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-300 to-cyan-400 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-32 left-20 w-12 h-12 bg-gradient-to-r from-green-300 to-emerald-400 rounded-full opacity-20 animate-bounce delay-1000"></div>
      
      <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <Mic className="w-10 h-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isSignUp ? 'Join VoiceBuddy!' : 'Welcome Back!'}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              {isSignUp ? 'Create your speech learning account' : 'Sign in to continue your journey'}
              <Sparkles className="inline w-4 h-4 ml-1 text-yellow-500" />
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choose a fun username"
                className="h-12 text-lg border-2 border-gray-200 focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a secure password"
                minLength={6}
                className="h-12 text-lg border-2 border-gray-200 focus:border-purple-400 transition-colors"
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name (Optional)</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="h-12 text-lg border-2 border-gray-200 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Choose Your Role</Label>
                  <RadioGroup 
                    value={role} 
                    onValueChange={(value) => setRole(value as 'child' | 'parent' | 'therapist')}
                    className="space-y-3"
                  >
                    {roleOptions.map((option) => (
                      <div key={option.value} className="relative">
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <Label 
                          htmlFor={option.value} 
                          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            role === option.value 
                              ? 'border-purple-400 bg-gradient-to-r ' + option.gradient + ' text-white shadow-lg transform scale-105' 
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <option.icon className={`w-6 h-6 ${role === option.value ? 'text-white' : 'text-gray-600'}`} />
                            <div>
                              <div className={`font-semibold ${role === option.value ? 'text-white' : 'text-gray-800'}`}>
                                {option.title}
                              </div>
                              <div className={`text-sm ${role === option.value ? 'text-white/90' : 'text-gray-600'}`}>
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-gray-200">
            <Button
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setUsername('');
                setPassword('');
                setFullName('');
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in here!'
                : "Don't have an account? Join VoiceBuddy today!"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
