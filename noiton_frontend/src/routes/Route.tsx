import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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
import EditaTarefa from '@/components/tarefa/EditaTarefa';
import { AuthProvider } from '@/context/ApiContext'; // Importa o AuthProvider
import RotinasScreen from '@/components/rotina/RotinasScreen';
import CriaRotina from '@/components/rotina/CriaRotina';

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
  EditaTarefa: { id_tarefa: number };
  RotinasScreen: undefined;
  CriaRotina: { tarefaBase?: any } | undefined;
  DetalhesTarefa: { tarefa: import('@/models/Tarefa').Tarefa };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppRoutes() {
  return (
    <AuthProvider>
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
          <Stack.Screen name="EditaTarefa" component={EditaTarefa} />
          <Stack.Screen name="RotinasScreen" component={RotinasScreen} />
          <Stack.Screen name="CriaRotina" component={CriaRotina} />
          <Stack.Screen name="DetalhesTarefa" component={require('@/components/tarefa/DetalhesTarefa').default} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}