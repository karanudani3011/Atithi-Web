import { useCallback, useEffect, useRef, useState } from 'react';
import SplashScene from './SplashScene.jsx';

export default function Splash({ onFinish }) {
  const [play, setPlay] = useState(false);
  const [done, setDone] = useState(false);
  const finished = useRef(false);
  const autoTimer = useRef(null);
  const finishTimer = useRef(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    window.clearTimeout(autoTimer.current);
    setDone(true);
    finishTimer.current = window.setTimeout(() => onFinishRef.current?.(), 800);
  }, []);

  useEffect(() => {
    setPlay(true);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    autoTimer.current = window.setTimeout(finish, reduceMotion ? 2500 : 8800);
    return () => {
      window.clearTimeout(autoTimer.current);
      window.clearTimeout(finishTimer.current);
    };
  }, [finish]);

  return <SplashScene play={play} done={done} onSkip={finish} />;
}
