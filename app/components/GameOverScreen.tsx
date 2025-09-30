import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

type Props = {
  score: number;
  onRestart: () => void;
};

const GameOverScreen: React.FC<Props> = ({ score, onRestart }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fim de Jogo!</Text>
      <Text style={styles.score}>Sua pontuação: {score}</Text>
      <Button title="Jogar Novamente" onPress={onRestart} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 20,
  },
  score: {
    fontSize: 20,
    color: '#ecf0f1',
    marginBottom: 20,
  },
});

export default GameOverScreen;