import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image } from 'react-native';
import { Gyroscope } from 'expo-sensors';
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
const INITIAL_MINES = 3;
const INITIAL_COINS = 5;

const generateRandomPosition = (size: number) => ({
  x: Math.random() * (width - size),
  y: Math.random() * (height - size),
});

export default function TesouroSubmarino() {
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [diverPosition, setDiverPosition] = useState({ x: width / 2, y: height / 2 });
  const [coins, setCoins] = useState(Array.from({ length: INITIAL_COINS }, () => ({ ...generateRandomPosition(COIN_SIZE), id: Math.random() })));
  const [mines, setMines] = useState(Array.from({ length: INITIAL_MINES }, () => ({ ...generateRandomPosition(MINE_SIZE), id: Math.random() })));
  const [oxygenTanks, setOxygenTanks] = useState(Array.from({ length: 1 }, () => ({ ...generateRandomPosition(OXYGEN_SIZE), id: Math.random() })));
  const [score, setScore] = useState(0);
  const [oxygen, setOxygen] = useState(INITIAL_OXYGEN);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const collectSound = useRef<Audio.Sound | null>(null);
  const explosionSound = useRef<Audio.Sound | null>(null);

  async function setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      const { sound: collect } = await Audio.Sound.createAsync(require('../../assets/sounds/collect.mp3'));
      collectSound.current = collect;

      const { sound: explosion } = await Audio.Sound.createAsync(require('../../assets/sounds/explosion.mp3'));
      explosionSound.current = explosion;
    } catch (error) {
      console.error("Não foi possível carregar e configurar o som", error);
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
    if (gameState !== 'playing') return;
    Gyroscope.setUpdateInterval(16); // ~60fps
    const subscription = Gyroscope.addListener(setGyroData);
    return () => subscription.remove();
  }, [gameState]);

  // EFEITO DE MOVIMENTO CORRIGIDO E SUAVIZADO
  useEffect(() => {
    if (gameState !== 'playing') return;

    const sensitivity = 12; // Sensibilidade equilibrada
    const smoothingFactor = 0.8; // Fator de suavização para evitar tremores

    // Interpola a posição atual com a nova posição para um movimento suave
    let newX = diverPosition.x * smoothingFactor + (diverPosition.x + gyroData.y * sensitivity) * (1 - smoothingFactor);
    let newY = diverPosition.y * smoothingFactor + (diverPosition.y - gyroData.x * sensitivity) * (1 - smoothingFactor);


    // Limites da tela
    if (newX < 0) newX = 0;
    if (newX > width - DIVER_SIZE) newX = width - DIVER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - DIVER_SIZE) newY = height - DIVER_SIZE;

    setDiverPosition({ x: newX, y: newY });
  }, [gyroData, gameState, diverPosition.x, diverPosition.y]); // Adicionei x e y para re-executar a cada frame


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
    if (gameState !== 'playing') return;

    const itemSpawner = setInterval(() => {
      setCoins(prev => [...prev, { ...generateRandomPosition(COIN_SIZE), id: Math.random() }]);
      if (Math.random() < 0.3) {
        setMines(prev => [...prev, { ...generateRandomPosition(MINE_SIZE), id: Math.random() }]);
      }
      if (Math.random() < 0.1) {
        setOxygenTanks(prev => [...prev, { ...generateRandomPosition(OXYGEN_SIZE), id: Math.random() }]);
      }
    }, 5000);

    return () => clearInterval(itemSpawner);
  }, [gameState]);


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
    setCoins(Array.from({ length: INITIAL_COINS }, () => ({ ...generateRandomPosition(COIN_SIZE), id: Math.random() })));
    setMines(Array.from({ length: INITIAL_MINES }, () => ({ ...generateRandomPosition(MINE_SIZE), id: Math.random() })));
    setOxygenTanks(Array.from({ length: 1 }, () => ({ ...generateRandomPosition(OXYGEN_SIZE), id: Math.random() })));
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
        <Image key={coin.id} source={require('../../assets/images/coin.png')} style={[styles.coin, { left: coin.x, top: coin.y }]} />
      ))}
      {mines.map(mine => (
        <Image key={mine.id} source={require('../../assets/images/mine.png')} style={[styles.mine, { left: mine.x, top: mine.y }]} />
      ))}
      {oxygenTanks.map(tank => (
        <Image key={tank.id} source={require('../../assets/images/oxygen.png')} style={[styles.oxygen, { left: tank.x, top: tank.y }]} />
      ))}

      <Image source={require('../../assets/images/diver.png')} style={[styles.diver, { left: diverPosition.x, top: diverPosition.y }]} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
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
    },
    diver: {
      position: 'absolute',
      width: DIVER_SIZE,
      height: DIVER_SIZE,
    },
    coin: {
      position: 'absolute',
      width: COIN_SIZE,
      height: COIN_SIZE,
    },
    mine: {
      position: 'absolute',
      width: MINE_SIZE,
      height: MINE_SIZE,
    },
    oxygen: {
      position: 'absolute',
      width: OXYGEN_SIZE,
      height: OXYGEN_SIZE,
    },
  });