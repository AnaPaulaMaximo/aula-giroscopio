import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  score: number;
  onRestart: () => void;
};

const GameOverScreen: React.FC<Props> = ({ score, onRestart }) => {
  return (
    <LinearGradient colors={['#3B9CFF', '#003366']} style={styles.container}>
      <Text style={styles.title}>Fim de Jogo!</Text>
      <Text style={styles.score}>Sua pontuação: {score}</Text>
      <Button title="Jogar Novamente" onPress={onRestart} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  score: {
    fontSize: 20,
    color: '#ecf0f1',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
});

export default GameOverScreen;