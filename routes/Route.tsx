import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Login from '@/components/My_components/home/login';
import HomePage from '../components/My_components/home/home'; // Importação do componente HomePage
import TelaPrincipal from '../components/My_components/home/telaPrincipal'; // Importação da TelaPrincipal
import CriaTarefa from '@/components/My_components/tarefa/CriaTarefa'; // Importação do componente CriaTarefa
import CriaCategoria from '@/components/My_components/categoria/CriaCategoria'; // Importação do componente CriaCategoria
import ListarCategoria from '@/components/My_components/categoria/ListarCategoria'; // Importação do componente ListarCategoria
import ListarTarefas from '@/components/My_components/tarefa/ListarTarefas'; // Importação do componente ListarTarefas
import CriaUsuario from '@/components/My_components/usuario/CriaUsuario'; // Importação do componente CriaUsuario

export type RootStackParamList = {
  Login: undefined;
  HomePage: undefined;
  TelaPrincipal: undefined;
  CriaTarefa: undefined;
  CriaCategoria: undefined;
  ListarCategoria: undefined;
  ListarTarefas: undefined;
  CriaUsuario: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <Stack.Navigator initialRouteName="HomePage">
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="HomePage" component={HomePage} />
      <Stack.Screen name="TelaPrincipal" component={TelaPrincipal} />
      <Stack.Screen name="CriaTarefa" component={CriaTarefa} />
      <Stack.Screen name="CriaCategoria" component={CriaCategoria} />
      <Stack.Screen name="ListarCategoria" component={ListarCategoria} />
      <Stack.Screen name="ListarTarefas" component={ListarTarefas} />
      <Stack.Screen name="CriaUsuario" component={CriaUsuario} />
    </Stack.Navigator>
  );
}

