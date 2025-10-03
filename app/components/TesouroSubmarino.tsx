import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text, Image, Animated } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';

const { width, height } = Dimensions.get('window');
const DIVER_SIZE = 70;
const COIN_SIZE = 40;
const MINE_SIZE = 50;
const OXYGEN_SIZE = 50;
const INITIAL_OXYGEN = 30;

const SCROLL_SPEED = 2;

// --- EFEITO DE BOLHAS ---
const BUBBLE_COUNT = 20;

const Bubble = ({ style }) => {
  return <Animated.View style={[styles.bubble, style]} />;
};


const generateRandomPosition = (size: number) => ({
  x: Math.random() * (width - size),
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
  const diverTilt = useRef(new Animated.Value(0)).current;

  // --- EFEITO DE BOLHAS ---
  const bubbles = useRef(
    [...Array(BUBBLE_COUNT)].map(() => ({
      x: Math.random() * width,
      y: new Animated.Value(height + 50),
      speed: 1 + Math.random() * 2,
      size: 10 + Math.random() * 20,
    }))
  ).current;

  // Função de animação corrigida com Animated.loop
  function animateBubbles() {
    bubbles.forEach(bubble => {
      bubble.y.setValue(height + Math.random() * 50);
      Animated.loop(
        Animated.timing(bubble.y, {
          toValue: -50,
          duration: (10000 + Math.random() * 5000) / bubble.speed,
          useNativeDriver: true,
        })
      ).start();
    });
  }


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
    if (gameState === 'playing') {
      animateBubbles();
    }
    return () => {
      collectSound.current?.unloadAsync();
      explosionSound.current?.unloadAsync();
    };
  }, [gameState]);

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

  // EFEITO DE MOVIMENTO REFINADO: DETECÇÃO SENSÍVEL COM VELOCIDADE LENTA
  useEffect(() => {
    if (gameState !== 'playing' || !neutralTilt) return;

    const sensitivity = 40; 
    const maxSpeed = 6;     
    const deadZone = 0.03;  

    const deltaY = accelerometerData.y - neutralTilt.y;
    const deltaX = accelerometerData.x - neutralTilt.x;

    let velocityX = 0;
    if (Math.abs(deltaY) > deadZone) {
      velocityX = deltaY * sensitivity;
    }

    let velocityY = 0;
    if (Math.abs(deltaX) > deadZone) {
      velocityY = -deltaX * sensitivity; 
    }

    // Limita a velocidade máxima
    if (velocityX > maxSpeed) velocityX = maxSpeed;
    if (velocityX < -maxSpeed) velocityX = -maxSpeed;
    if (velocityY > maxSpeed) velocityY = maxSpeed;
    if (velocityY < -maxSpeed) velocityY = -maxSpeed;

    Animated.spring(diverTilt, {
        toValue: deltaY * -20,
        friction: 5,
        useNativeDriver: true,
      }).start();


    let newX = diverPosition.x + velocityX;
    let newY = diverPosition.y + velocityY;

    // Limites da tela
    if (newX < 0) newX = 0;
    if (newX > width - DIVER_SIZE) newX = width - DIVER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - DIVER_SIZE) newY = height - DIVER_SIZE;

    setDiverPosition({ x: newX, y: newY });
  }, [accelerometerData, gameState, neutralTilt]);


  // Game Loop Principal
  useEffect(() => {
    if (gameState !== 'playing') return;
    const gameLoop = setInterval(() => {
      setCoins(prev => prev.map(c => ({ ...c, y: c.y - SCROLL_SPEED })).filter(c => c.y > -COIN_SIZE));
      setMines(prev => prev.map(m => ({ ...m, y: m.y - SCROLL_SPEED })).filter(m => m.y > -MINE_SIZE));
      setOxygenTanks(prev => prev.map(t => ({ ...t, y: t.y - SCROLL_SPEED })).filter(t => t.y > -OXYGEN_SIZE));

      if (Math.random() < 0.02) {
        setCoins(prev => [...prev, generateRandomPosition(COIN_SIZE)]);
      }
      if (Math.random() < 0.01) {
        setMines(prev => [...prev, generateRandomPosition(MINE_SIZE)]);
      }
      if (Math.random() < 0.005) {
        setOxygenTanks(prev => [...prev, generateRandomPosition(OXYGEN_SIZE)]);
      }
    }, 16);
    return () => clearInterval(gameLoop);
  }, [gameState]);

  // Colisões
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
          setOxygen(prev => Math.min(prev + 10, INITIAL_OXYGEN));
          setOxygenTanks(prev => prev.filter(t => t.id !== tank.id));
          collectSound.current?.replayAsync();
        }
      });
  }, [diverPosition, gameState, coins, mines, oxygenTanks]);

  // Timer de Oxigênio corrigido
  useEffect(() => {
    if (gameState !== 'playing') {
      return;
    }
    const timerId = setInterval(() => {
      setOxygen(prev => {
        if (prev <= 1) {
          setGameState('gameOver');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameState]);

  const handleStartGame = () => {
    setScore(0);
    setOxygen(INITIAL_OXYGEN);
    setDiverPosition({ x: width / 2, y: height / 2 });
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
    <LinearGradient colors={['#005f9ea8', '#001a35c4']} style={styles.container}>
     {bubbles.map((bubble, index) => (
       <Bubble
         key={index}
         style={{
           left: bubble.x,
           transform: [{ translateY: bubble.y }],
           width: bubble.size,
           height: bubble.size,
         }}
       />
     ))}
      <View style={styles.hud}>
        <Text style={styles.hudText}>Pontos: {score}</Text>
        <View style={styles.oxygenContainer}>
          <Text style={styles.hudText}>Oxigênio: </Text>
          <View style={styles.oxygenBar}>
            <View style={{ width: `${(oxygen / INITIAL_OXYGEN) * 100}%`, ...styles.oxygenFill }} />
          </View>
        </View>
      </View>
      {coins.map(coin => (
        <Image key={coin.id} source={require('../../assets/images/coin.png')} style={[styles.item, styles.coin, { width: COIN_SIZE, height: COIN_SIZE, left: coin.x, top: coin.y }]} />
      ))}
      {mines.map(mine => (
        <Image key={mine.id} source={require('../../assets/images/mine.png')} style={[styles.item, { width: MINE_SIZE, height: MINE_SIZE, left: mine.x, top: mine.y }]} />
      ))}
      {oxygenTanks.map(tank => (
        <Image key={tank.id} source={require('../../assets/images/oxygen.png')} style={[styles.item, styles.oxygen, { width: OXYGEN_SIZE, height: OXYGEN_SIZE, left: tank.x, top: tank.y }]} />
      ))}
      <Animated.Image
        source={require('../../assets/images/diver.png')}
        style={[
          styles.diver,
          {
            left: diverPosition.x,
            top: diverPosition.y,
            transform: [{ rotateZ: diverTilt.interpolate({ inputRange: [-20, 20], outputRange: ['-20deg', '20deg'], extrapolate: 'clamp' }) }],
          },
        ]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    hud: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 10,
        borderRadius: 10,
      },
    hudText: {
      fontSize: 20,
      color: '#fff',
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: -1, height: 1 },
      textShadowRadius: 10,
    },
    oxygenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      oxygenBar: {
        height: 20,
        width: 100,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 10,
        marginLeft: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
      },
      oxygenFill: {
        height: '100%',
        backgroundColor: '#3B9CFF',
      },
    diver: {
      position: 'absolute',
      width: DIVER_SIZE,
      height: DIVER_SIZE,
      zIndex: 5,
    },
    item: {
      position: 'absolute',
      shadowColor: '#fff',
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.8,
      shadowRadius: 15,
      elevation: 10,
    },
    coin: {
        // animação de brilho
    },
    mine: {
        // animação de perigo
    },
    oxygen: {
        // animação de bolhas
    },
    bubble: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 100,
        // Y é controlado pelo Animated.Value
      },
  });