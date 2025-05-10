import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/routes/Route'; // Corrigida a importação

export default function HomePage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CriaUsuario')} // Direciona para CriaUsuario
        >
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>Bem-vindo ao Noiton, seu app de tarefas!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc', // Fundo bege
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#8B4513', // Marrom
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff', // Texto branco
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513', // Texto marrom
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
  },
});
