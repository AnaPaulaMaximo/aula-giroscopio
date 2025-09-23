import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { Gyroscope } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ORB_SIZE = 30;

const generateRandomPosition = () => {
  const position = {
    // Garante que o orbe apareça completamente dentro da tela
    // Considera também as bordas para evitar cortes
    x: Math.random() * (width - ORB_SIZE - 4), // -4 para considerar borderWidth
    y: Math.random() * (height - ORB_SIZE - 4 - 100), // -100 para evitar área das instruções
  };
  return position;
};

export default function App() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [playerPosition, setPlayerPosition] = useState({ x: width / 2, y: height / 2 });
  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());

  useEffect(() => {
    Gyroscope.setUpdateInterval(100); // Reduz para mais suavidade
    const subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Reduz a sensibilidade e aplica suavização
    let newX = playerPosition.x + data.y * 1.5; // Reduzido de 3 para 1.5
    let newY = playerPosition.y - data.x * 1.5; // Reduzido de 3 para 1.5

    // Aplica suavização para reduzir tremores
    const smoothingFactor = 0.8;
    newX = playerPosition.x * (1 - smoothingFactor) + newX * smoothingFactor;
    newY = playerPosition.y * (1 - smoothingFactor) + newY * smoothingFactor;

    // Limites da tela considerando as bordas
    if (newX < 2) newX = 2; // Margem para bordas
    if (newX > width - PLAYER_SIZE - 2) newX = width - PLAYER_SIZE - 2;
    if (newY < 2) newY = 2;
    if (newY > height - PLAYER_SIZE - 2) newY = height - PLAYER_SIZE - 2;

    setPlayerPosition({ x: newX, y: newY });
  }, [data, playerPosition.x, playerPosition.y]);

  useEffect(() => {
    const playerCenterX = playerPosition.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPosition.y + PLAYER_SIZE / 2;
    const orbCenterX = orbPosition.x + ORB_SIZE / 2;
    const orbCenterY = orbPosition.y + ORB_SIZE / 2;

    const dx = playerCenterX - orbCenterX;
    const dy = playerCenterY - orbCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Coleta quando as bordas das bolas se tocam visualmente
    const collisionDistance = (PLAYER_SIZE / 2) + (ORB_SIZE / 2);
    
    if (distance <= collisionDistance) {
      setOrbPosition(generateRandomPosition());
    }
  }, [playerPosition]);

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>Colete o orbe azul!</Text>
     
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
  instructions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
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