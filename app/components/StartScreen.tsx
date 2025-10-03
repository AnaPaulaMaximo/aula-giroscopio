import React from 'react';
import { View, Text, Button, StyleSheet, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  onStart: () => void;
};

const StartScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <LinearGradient colors={['#005f9ea8', '#001a35c4']} style={styles.container}>
      <Text style={styles.title}>Tesouro Submarino</Text>
      <Image source={require('../../assets/images/diver.png')} style={styles.diverImage} />
      <Text style={styles.instructions}>
        Incline o seu dispositivo para desviar das minas e coletar as moedas e tanques de oxigênio!
      </Text>
      <Pressable style={styles.button} onPress={onStart}>
        <Text style={styles.buttonText}>Iniciar Jogo</Text>
      </Pressable>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  diverImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  instructions: {
    fontSize: 18,
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#f39c12',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default StartScreen;