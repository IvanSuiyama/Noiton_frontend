import React from 'react';
import { View, StyleSheet } from 'react-native';
import SelectBox from './src/components/SelectBox';

export default function App() {
  return (
    <View style={styles.container}>
      <SelectBox />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
