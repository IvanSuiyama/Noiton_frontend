import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/routes/Route';
import { useAuth } from '@/context/ApiContext';
import { useUserContext } from '@/context/UserContext';

export default function Logoff() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { setToken } = useAuth();
  const { setUserCpf } = useUserContext();

  useEffect(() => {
    // Limpa o token e o CPF do contexto
    setToken(null);
    setUserCpf(null);
    Alert.alert('Logoff', 'Você saiu do sistema.');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B4513" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5dc',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
