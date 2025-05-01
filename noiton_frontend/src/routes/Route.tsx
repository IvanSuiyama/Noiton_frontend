import React from 'react';
import { NavigationContainer } from '@react-navigation/native'; // Importação do NavigationContainer
import { createStackNavigator } from '@react-navigation/stack';
import Login from '@/components/home/login';
import HomePage from '@/components/home/home';
import TelaPrincipal from '@/components/home/telaPrincipal';
import CriaTarefa from '@/components/tarefa/CriaTarefa';
import CriaCategoria from '@/components/categoria/CriarCategoria';
import ListarCategoria from '@/components/categoria/ListarCategoria';
import ListarTarefas from '@/components/tarefa/ListarTarefas';
import CriaUsuario from '@/components/usuario/CriaUsuario';
import EditaUsuario from '@/components/usuario/EditaUsuario';

export type RootStackParamList = {
  Login: undefined;
  HomePage: undefined;
  TelaPrincipal: undefined;
  CriaTarefa: undefined;
  CriaCategoria: undefined;
  ListarCategoria: undefined;
  ListarTarefas: undefined;
  CriaUsuario: undefined;
  EditaUsuario: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomePage">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="TelaPrincipal" component={TelaPrincipal} />
        <Stack.Screen name="CriaTarefa" component={CriaTarefa} />
        <Stack.Screen name="CriaCategoria" component={CriaCategoria} />
        <Stack.Screen name="ListarCategoria" component={ListarCategoria} />
        <Stack.Screen name="ListarTarefas" component={ListarTarefas} />
        <Stack.Screen name="CriaUsuario" component={CriaUsuario} />
        <Stack.Screen name="EditaUsuario" component={EditaUsuario} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}