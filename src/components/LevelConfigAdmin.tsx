import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDetailedProgress } from '@/hooks/useDetailedProgress';
import { CURRICULUM_LEVELS } from '@/data/curriculum';
import { Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LevelConfigAdmin = () => {
  const { levelConfigs, updateLevelPassScore, loading } = useDetailedProgress();
  const [editingScores, setEditingScores] = useState<Record<number, number>>({});
  const { toast } = useToast();

  const handleScoreChange = (levelId: number, score: string) => {
    const numScore = parseInt(score);
    if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
      setEditingScores(prev => ({ ...prev, [levelId]: numScore }));
    }
  };

  const handleSaveScore = async (levelId: number) => {
    const newScore = editingScores[levelId];
    if (newScore !== undefined) {
      try {
        await updateLevelPassScore(levelId, newScore);
        setEditingScores(prev => {
          const updated = { ...prev };
          delete updated[levelId];
          return updated;
        });
        toast({
          title: "Success",
          description: `Pass score for Level ${levelId} updated to ${newScore}%`,
        });
        console.log(`✅ Level ${levelId} pass score updated to ${newScore}%`);
      } catch (error) {
        console.error('❌ Error updating pass score:', error);
        toast({
          title: "Error",
          description: "Failed to update pass score",
          variant: "destructive",
        });
      }
    }
  };

  const handleResetScore = (levelId: number) => {
    setEditingScores(prev => {
      const updated = { ...prev };
      delete updated[levelId];
      return updated;
    });
  };

  if (loading) {
    return <div>Loading level configurations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Level Pass Score Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {CURRICULUM_LEVELS.map(level => {
            const currentScore = levelConfigs[level.id]?.pass_score || level.requiredScoreToPass;
            const editingScore = editingScores[level.id];
            const isEditing = editingScore !== undefined;
            
            return (
              <div key={level.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">Level {level.id}: {level.name}</h4>
                  <p className="text-sm text-gray-600">{level.ageRange}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`score-${level.id}`} className="text-sm">
                    Pass Score:
                  </Label>
                  <Input
                    id={`score-${level.id}`}
                    type="number"
                    min="0"
                    max="100"
                    value={isEditing ? editingScore : currentScore}
                    onChange={(e) => handleScoreChange(level.id, e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  
                  {isEditing ? (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveScore(level.id)}
                        className="px-2"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetScore(level.id)}
                        className="px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingScores(prev => ({ ...prev, [level.id]: currentScore }))}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Configuration Help</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Pass scores determine when a student can advance to the next level</li>
            <li>• Changes apply to all users immediately</li>
            <li>• Recommended range: 70-95% depending on level difficulty</li>
            <li>• Higher levels typically require higher pass scores</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelConfigAdmin;