import { GameStartScreen } from '../components/landing/GameStartScreen';
import { CategorySelection } from '../components/landing/CategorySelection';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function GameStart() {
  const navigate = useNavigate();
  const [showCategorySelection, setShowCategorySelection] = useState(false);

  if (showCategorySelection) {
    return (
      <CategorySelection 
        isOpen={true} 
        onClose={() => navigate('/')}
        onBack={() => setShowCategorySelection(false)}
      />
    );
  }

  return (
    <GameStartScreen 
      isOpen={true} 
      onClose={() => navigate('/')}
      onBack={() => navigate('/')}
      onStartPlaying={() => setShowCategorySelection(true)}
    />
  );
}
