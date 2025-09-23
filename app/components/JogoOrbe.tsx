import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import { Gyroscope } from 'expo-sensors';

const { width, height } = Dimensions.get('window');
const PLAYER_SIZE = 50;
const ORB_SIZE = 30;

// A função que gera a posição do orbe.
const generateRandomPosition = () => {
  // --- CORREÇÃO 1: Orbes Fora da Tela ---
  // O problema era que a posição aleatória ia de 0 até a largura/altura total da tela.
  // Isso fazia com que o *ponto inicial* (canto superior esquerdo) do orbe pudesse ser
  // sorteado no limite da tela, deixando o resto do seu corpo para fora.
  // A SOLUÇÃO é subtrair o tamanho do orbe (ORB_SIZE) do limite máximo do sorteio.
  // Assim, a posição máxima sorteada garante que o orbe caberá inteiramente na tela.
  const position = {
    x: Math.random() * (width - ORB_SIZE),
    y: Math.random() * (height - ORB_SIZE),
  };
  return position;
};

export default function App() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [playerPosition, setPlayerPosition] = useState({ x: width / 2, y: height / 2 });
  const [orbPosition, setOrbPosition] = useState(generateRandomPosition());

  useEffect(() => {
    // --- CORREÇÃO 2: Movimento Travado ---
    // O valor original de '500' era muito alto, significando que o sensor só enviava
    // atualizações 2 vezes por segundo, causando o efeito "travado" ou "pulando".
    // A SOLUÇÃO é usar um intervalo baixo, como '16' milissegundos, que equivale a
    // aproximadamente 60 quadros por segundo (60fps), resultando em um movimento suave.
    Gyroscope.setUpdateInterval(16);

    const subscription = Gyroscope.addListener(gyroscopeData => {
      setData(gyroscopeData);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // --- CORREÇÃO 3: Controles Invertidos e Lentos ---
    // 1. (INVERSÃO): Os operadores matemáticos estavam trocados. O eixo Y do giroscópio (inclinar
    //    para os lados) deve controlar o eixo X da tela, e o sinal deve ser negativo para que
    //    inclinar para a direita mova a bola para a direita. O mesmo se aplica ao eixo Y.
    // 2. (LENTIDÃO): O multiplicador '3' era muito baixo, resultando em pouca sensibilidade.
    // A SOLUÇÃO é inverter os operadores (+ para -, - para +) e aumentar o multiplicador
    // para um valor como '10', tornando os controles mais responsivos.
    let newX = playerPosition.x - data.y * 10; // Inclinar para os lados (eixo Y) move no eixo X

    let newY = playerPosition.y - data.x * 10; // Inclinar para frente/trás (eixo X) move no eixo Y

    // Esta parte do código (limites da tela) já estava correta.
    if (newX < 0) newX = 0;
    if (newX > width - PLAYER_SIZE) newX = width - PLAYER_SIZE;
    if (newY < 0) newY = 0;
    if (newY > height - PLAYER_SIZE) newY = height - PLAYER_SIZE;

    setPlayerPosition({ x: newX, y: newY });
  }, [data]);

  useEffect(() => {
    // Lógica para detectar colisão
    const playerCenterX = playerPosition.x + PLAYER_SIZE / 2;
    const playerCenterY = playerPosition.y + PLAYER_SIZE / 2;
    const orbCenterX = orbPosition.x + ORB_SIZE / 2;
    const orbCenterY = orbPosition.y + ORB_SIZE / 2;

    const dx = playerCenterX - orbCenterX;
    const dy = playerCenterY - orbCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // --- CORREÇÃO 4: Coleta "Fantasma" ---
    // O problema era que a condição de colisão comparava a distância com a SOMA DOS DIÂMETROS
    // (PLAYER_SIZE + ORB_SIZE), o que criava uma área de detecção muito grande.
    // A SOLUÇÃO correta para colisões circulares é comparar a distância entre os centros
    // com a SOMA DOS RAIOS (Tamanho / 2).
    if (distance < (PLAYER_SIZE / 2) + (ORB_SIZE / 2)) {
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

// Os estilos não precisaram de alteração.
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