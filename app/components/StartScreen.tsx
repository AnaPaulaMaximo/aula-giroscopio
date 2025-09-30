import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

type Props = {
  onStart: () => void;
};

const StartScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao Jogo do Orbe!</Text>
      <Button title="Iniciar Jogo" onPress={onStart} />
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
});

export default StartScreen;