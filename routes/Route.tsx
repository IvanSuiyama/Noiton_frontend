import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '@/components/My_components/home/login';
import HomePage from '../components/My_components/home/home'; // Importação do componente HomePage
import TelaPrincipal from '../components/My_components/home/telaPrincipal'; // Importação da TelaPrincipal
import CriaTarefa from '@/components/My_components/tarefa/CriaTarefa'; // Importação do componente CriaTarefa

export type RootStackParamList = {
  Login: undefined;
  HomePage: undefined;
  TelaPrincipal: undefined;
  CriaTarefa: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="HomePage">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="TelaPrincipal" component={TelaPrincipal} />
      <Stack.Screen name="CriaTarefa" component={CriaTarefa} />
    </Stack.Navigator>
  );
}
