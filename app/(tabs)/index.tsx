import React from 'react';
import { StyleSheet, View } from 'react-native';
import App from './App';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <App />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 9, // Espaçamento superior de 9px
  },
});
