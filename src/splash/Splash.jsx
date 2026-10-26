import { useCallback, useEffect, useState } from 'react';
import SplashScene from './SplashScene.jsx';

export default function Splash({ onFinish }) {
  const [ended, setEnded] = useState(false);

  const finish = useCallback(() => {
    if (!ended) {
      setEnded(true);
      setTimeout(onFinish, 650);
    }
  }, [ended, onFinish]);

  // Support Escape key to quickly skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finish]);

  return (
    <div className={`splash ${ended ? 'splash-out' : ''}`}>
      {/* Skip button – keyboard accessible */}
      <button
        type="button"
        className="skip"
        onClick={finish}
        aria-label="Skip intro and enter website"
        title="Press Escape to skip"
      >
        SKIP ›
      </button>

      <SplashScene onFinish={finish} />

      <div className="loading-dots" aria-hidden="true">
        <i /><i /><i />
      </div>
    </div>
  );
}
