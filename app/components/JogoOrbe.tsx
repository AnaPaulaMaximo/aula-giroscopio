import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { Audio } from 'expo-av';
import StartScreen from '../components/StartScreen';
import GameOverScreen from '../components/GameOverScreen';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ORB_SIZE = 30;
const INITIAL_TIME = 15; // Tempo inicial em segundos

const generateRandomPosition = () => {
  const position = {
    x: Math.random() * (width - ORB_SIZE),
    y: Math.random() * (height - ORB_SIZE),
  };
  return position;
};

export default function JogoOrbe() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [playerPosition, setPlayerPosition] = useState({ x: width / 2, y: height / 2 });
  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const soundObject = useRef<Audio.Sound | null>(null);

  // --- CORREÇÃO DE SOM (INÍCIO) ---
  // Função para configurar o modo de áudio e carregar o som.
  async function setupAudio() {
    try {
      // Configura o modo de áudio para permitir a reprodução no iOS em modo silencioso.
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/collect.mp3')
      );
      soundObject.current = sound;
    } catch (error) {
      console.error("Não foi possível carregar e configurar o som", error);
    }
  }

  useEffect(() => {
    setupAudio();

    return () => {
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);
  // --- CORREÇÃO DE SOM (FIM) ---

  useEffect(() => {
    if (gameState !== 'playing') return;

    Gyroscope.setUpdateInterval(16);
    const subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });

    return () => subscription.remove();
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    // --- CORREÇÃO DO EIXO DO GIROSCÓPIO ---
    // Invertemos os eixos para que o movimento seja mais natural:
    // Inclinar para os lados (eixo Y do giroscópio) move o jogador no eixo X.
    // Inclinar para frente/trás (eixo X do giroscópio) move o jogador no eixo Y.
    // Usamos o sinal de SOMA (+) para que a direção do movimento corresponda à inclinação.
    let newX = playerPosition.x + data.y * 10;
    let newY = playerPosition.y + data.x * 10;


    if (newX < 0) newX = 0;
    if (newX > width - PLAYER_SIZE) newX = width - PLAYER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - PLAYER_SIZE) newY = height - PLAYER_SIZE;

    setPlayerPosition({ x: newX, y: newY });
  }, [data, gameState]);

  // Efeito para a colisão e placar
  useEffect(() => {
    if (gameState !== 'playing') return;

    const playerCenterX = playerPosition.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPosition.y + PLAYER_SIZE / 2;
    const orbCenterX = orbPosition.x + ORB_SIZE / 2;
    const orbCenterY = orbPosition.y + ORB_SIZE / 2;

    const dx = playerCenterX - orbCenterX;
    const dy = playerCenterY - orbCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < (PLAYER_SIZE / 2) + (ORB_SIZE / 2)) {
      setScore(prevScore => prevScore + 1);
      setOrbPosition(generateRandomPosition());
      
      // --- CORREÇÃO DE SOM (REPRODUÇÃO) ---
      // Garante que o som seja tocado do início a cada coleta.
      if (soundObject.current) {
        soundObject.current.replayAsync();
      }
      
      setTimeLeft(prevTime => Math.max(prevTime - 0.5, 5));
    }
  }, [playerPosition, gameState]);
  
  // Efeito para o timer
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) {
      if (timeLeft <= 0) {
        setGameState('gameOver');
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [gameState, timeLeft]);

  const handleStartGame = () => {
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setPlayerPosition({ x: width / 2, y: height / 2 });
    setOrbPosition(generateRandomPosition());
    setGameState('playing');
  };

  const handleRestartGame = () => {
    handleStartGame();
  };

  if (gameState === 'start') {
    return <StartScreen onStart={handleStartGame} />;
  }

  if (gameState === 'gameOver') {
    return <GameOverScreen score={score} onRestart={handleRestartGame} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.scoreText}>Pontos: {score}</Text>
      <Text style={styles.timerText}>Tempo: {timeLeft}</Text>
      
      <View
        style={[
          styles.orb,
          {
            left: orbPosition.x,
            top: orbPosition.y,
          },
        ]}
      />
      
      <View
        style={[
          styles.player,
          {
            left: playerPosition.x,
            top: playerPosition.y,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#2c3e50',
    },
    scoreText: {
      position: 'absolute',
      top: 40,
      left: 20,
      fontSize: 20,
      color: '#fff',
    },
    timerText: {
      position: 'absolute',
      top: 40,
      right: 20,
      fontSize: 20,
      color: '#fff',
    },
    player: {
      position: 'absolute',
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      borderRadius: PLAYER_SIZE / 2,
      backgroundColor: 'coral',
      borderWidth: 2,
      borderColor: '#fff',
    },
    orb: {
      position: 'absolute',
      width: ORB_SIZE,
      height: ORB_SIZE,
      borderRadius: ORB_SIZE / 2,
      backgroundColor: '#3498db',
      borderWidth: 2,
      borderColor: '#fff',
    },
  });