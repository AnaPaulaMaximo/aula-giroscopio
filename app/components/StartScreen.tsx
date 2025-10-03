import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onStart: () => void;
};

const StartScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <LinearGradient colors={['#3B9CFF', '#003366']} style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Tesouro Submarino!</Text>
      <Button title="Iniciar Jogo" onPress={onStart} />
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
});

export default StartScreen;