import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';

const { width, height } = Dimensions.get('window');
const DIVER_SIZE = 50;
const COIN_SIZE = 30;
const MINE_SIZE = 40;
const OXYGEN_SIZE = 40;
const INITIAL_OXYGEN = 30;

// Velocidade com que o cenário "sobe"
const SCROLL_SPEED = 1.5;

const generateRandomPosition = (size: number) => ({
  x: Math.random() * (width - size),
  // Nasce um pouco abaixo da tela
  y: height + Math.random() * height, 
  id: Math.random(),
});

export default function TesouroSubmarino() {
  const [accelerometerData, setAccelerometerData] = useState({ x: 0, y: 0, z: 0 });
  const [neutralTilt, setNeutralTilt] = useState<{ x: number; y: number } | null>(null);
  const [diverPosition, setDiverPosition] = useState({ x: width / 2, y: height / 2 });
  const [coins, setCoins] = useState<any[]>([]);
  const [mines, setMines] = useState<any[]>([]);
  const [oxygenTanks, setOxygenTanks] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  const [oxygen, setOxygen] = useState(INITIAL_OXYGEN);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const collectSound = useRef<Audio.Sound | null>(null);
  const explosionSound = useRef<Audio.Sound | null>(null);

  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: collect } = await Audio.Sound.createAsync(require('../../assets/sounds/collect.mp3'));
      collectSound.current = collect;
      const { sound: explosion } = await Audio.Sound.createAsync(require('../../assets/sounds/explosion.mp3'));
      explosionSound.current = explosion;
    } catch (error) {
      console.error("Não foi possível carregar o som", error);
    }
  }

  useEffect(() => {
    setupAudio();
    return () => {
      collectSound.current?.unloadAsync();
      explosionSound.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'playing') {
      Accelerometer.removeAllListeners();
      return;
    }
    Accelerometer.setUpdateInterval(16);
    const subscription = Accelerometer.addListener(data => {
      if (!neutralTilt) {
        setNeutralTilt({ x: data.x, y: data.y });
      }
      setAccelerometerData(data);
    });
    return () => subscription.remove();
  }, [gameState, neutralTilt]);

  // Game Loop Principal para movimento de cenário e itens
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move todos os itens para cima
      setCoins(prev => prev.map(c => ({ ...c, y: c.y - SCROLL_SPEED })).filter(c => c.y > -COIN_SIZE));
      setMines(prev => prev.map(m => ({ ...m, y: m.y - SCROLL_SPEED })).filter(m => m.y > -MINE_SIZE));
      setOxygenTanks(prev => prev.map(t => ({ ...t, y: t.y - SCROLL_SPEED })).filter(t => t.y > -OXYGEN_SIZE));

      // Gera novos itens aleatoriamente
      if (Math.random() < 0.02) { // Chance de gerar moeda
        setCoins(prev => [...prev, generateRandomPosition(COIN_SIZE)]);
      }
      if (Math.random() < 0.01) { // Chance de gerar mina
        setMines(prev => [...prev, generateRandomPosition(MINE_SIZE)]);
      }
      if (Math.random() < 0.005) { // Chance de gerar oxigênio
        setOxygenTanks(prev => [...prev, generateRandomPosition(OXYGEN_SIZE)]);
      }
    }, 16); // Roda a ~60fps

    return () => clearInterval(gameLoop);
  }, [gameState]);


  useEffect(() => {
    if (gameState !== 'playing' || !neutralTilt) return;
    const sensitivity = 18;
    const deltaY = accelerometerData.y - neutralTilt.y;
    const deltaX = accelerometerData.x - neutralTilt.x;

    let newX = diverPosition.x + deltaY * sensitivity;
    let newY = diverPosition.y - deltaX * sensitivity;

    if (newX < 0) newX = 0;
    if (newX > width - DIVER_SIZE) newX = width - DIVER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - DIVER_SIZE) newY = height - DIVER_SIZE;
    setDiverPosition({ x: newX, y: newY });
  }, [accelerometerData, gameState, neutralTilt]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const diverCenterX = diverPosition.x + DIVER_SIZE / 2;
    const diverCenterY = diverPosition.y + DIVER_SIZE / 2;
    coins.forEach(coin => {
      const coinCenterX = coin.x + COIN_SIZE / 2;
      const coinCenterY = coin.y + COIN_SIZE / 2;
      const dx = diverCenterX - coinCenterX;
      const dy = diverCenterY - coinCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (DIVER_SIZE / 2) + (COIN_SIZE / 2)) {
        setScore(prev => prev + 1);
        setCoins(prev => prev.filter(c => c.id !== coin.id));
        collectSound.current?.replayAsync();
      }
    });
    mines.forEach(mine => {
      const mineCenterX = mine.x + MINE_SIZE / 2;
      const mineCenterY = mine.y + MINE_SIZE / 2;
      const dx = diverCenterX - mineCenterX;
      const dy = diverCenterY - mineCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < (DIVER_SIZE / 2) + (MINE_SIZE / 2)) {
        explosionSound.current?.replayAsync();
        setGameState('gameOver');
      }
    });
    oxygenTanks.forEach(tank => {
        const tankCenterX = tank.x + OXYGEN_SIZE / 2;
        const tankCenterY = tank.y + OXYGEN_SIZE / 2;
        const dx = diverCenterX - tankCenterX;
        const dy = diverCenterY - tankCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < (DIVER_SIZE / 2) + (OXYGEN_SIZE / 2)) {
          setOxygen(prev => prev + 10);
          setOxygenTanks(prev => prev.filter(t => t.id !== tank.id));
          collectSound.current?.replayAsync();
        }
      });
  }, [diverPosition, gameState, coins, mines, oxygenTanks]);
  
  useEffect(() => {
    if (gameState !== 'playing' || oxygen <= 0) {
      if (oxygen <= 0) {
        setGameState('gameOver');
      }
      return;
    }
    const timerId = setInterval(() => {
      setOxygen(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState, oxygen]);

  const handleStartGame = () => {
    setScore(0);
    setOxygen(INITIAL_OXYGEN);
    setDiverPosition({ x: width / 2, y: height / 2 });
    // Inicia com alguns itens já na tela
    setCoins(Array.from({ length: 5 }, () => ({ ...generateRandomPosition(COIN_SIZE), y: Math.random() * height })));
    setMines(Array.from({ length: 2 }, () => ({ ...generateRandomPosition(MINE_SIZE), y: Math.random() * height })));
    setOxygenTanks([]);
    setNeutralTilt(null);
    setGameState('playing');
  };

  if (gameState === 'start') {
    return <StartScreen onStart={handleStartGame} />;
  }
  if (gameState === 'gameOver') {
    return <GameOverScreen score={score} onRestart={handleStartGame} />;
  }

  return (
    <LinearGradient colors={['#3B9CFF', '#003366']} style={styles.container}>
      <Text style={styles.hudText}>Pontos: {score}</Text>
      <Text style={[styles.hudText, { left: 150 }]}>Oxigênio: {oxygen}</Text>
      {coins.map(coin => (
        <Image key={coin.id} source={require('../../assets/images/coin.png')} style={[styles.item, { width: COIN_SIZE, height: COIN_SIZE, left: coin.x, top: coin.y }]} />
      ))}
      {mines.map(mine => (
        <Image key={mine.id} source={require('../../assets/images/mine.png')} style={[styles.item, { width: MINE_SIZE, height: MINE_SIZE, left: mine.x, top: mine.y }]} />
      ))}
      {oxygenTanks.map(tank => (
        <Image key={tank.id} source={require('../../assets/images/oxygen.png')} style={[styles.item, { width: OXYGEN_SIZE, height: OXYGEN_SIZE, left: tank.x, top: tank.y }]} />
      ))}
      <Image source={require('../../assets/images/diver.png')} style={[styles.diver, { left: diverPosition.x, top: diverPosition.y }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden', // Esconde os itens fora da tela
    },
    hudText: {
      position: 'absolute',
      top: 20,
      left: 20,
      fontSize: 20,
      color: '#fff',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
      zIndex: 10, // Garante que o placar fique por cima de tudo
    },
    diver: {
      position: 'absolute',
      width: DIVER_SIZE,
      height: DIVER_SIZE,
      zIndex: 5, // Mergulhador fica na frente dos itens
    },
    item: {
      position: 'absolute',
    },
    coin: {
        position: 'absolute',
    },
    mine: {
        position: 'absolute',
    },
    oxygen: {
        position: 'absolute',
    }
  });