import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/routes/Route'; // Corrigida a importação
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isEnglish } = useLanguage();
  const translations = {
    pt: {
      login: 'Login',
      cadastrar: 'Cadastrar',
      bemVindo: 'Bem-vindo ao Noiton, seu app de tarefas!',
    },
    en: {
      login: 'Login',
      cadastrar: 'Register',
      bemVindo: 'Welcome to Noiton, your task app!',
    },
  };
  const t = isEnglish ? translations.en : translations.pt;

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>{t.login}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('CriaUsuario')}
        >
          <Text style={styles.buttonText}>{t.cadastrar}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>{t.bemVindo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5dc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
    width: '100%',
  },
});
