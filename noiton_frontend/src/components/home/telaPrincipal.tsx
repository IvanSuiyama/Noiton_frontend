import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import HamburgerMenu from '../menu/HamburguerMenu';
import PopUpUser from './PopUpUser';

export default function TelaPrincipal() {
  const [isPopUpVisible, setPopUpVisible] = useState(false);

  const handleAvatarPress = () => {
    setPopUpVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Menu Sanduíche */}
      <HamburgerMenu />

      {/* Ícone de Avatar */}
      <TouchableOpacity style={styles.avatarButton} onPress={handleAvatarPress}>
        <MaterialIcons name="account-circle" size={40} color="#000" />
      </TouchableOpacity>

      {/* PopUpUser */}
      <PopUpUser visible={isPopUpVisible} onClose={() => setPopUpVisible(false)} />

      {/* Conteúdo da Tela */}
      <View style={styles.content}>
        <Text style={styles.text}>Bem-vindo a o Noiton!</Text> {/* Certifique-se de que está dentro de <Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  avatarButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  // Linhas decorativas no fundo
  containerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  line: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#ccc',
  },
});
