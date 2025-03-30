import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/routes/Route';

export default function HamburgerMenu() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null); // Controla o menu expandido
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuItemPress = (item: string) => {
    if (item === 'Tarefas') {
      setExpandedMenu(expandedMenu === 'Tarefas' ? null : 'Tarefas'); // Expande ou recolhe o menu
    } else {
      setMenuVisible(false); // Fecha o menu ao clicar em outros itens
    }
  };

  const handleSubMenuItemPress = (subItem: string) => {
    console.log(`Navegando para: ${subItem}`); // Log para depuração
    setMenuVisible(false); // Fecha o menu ao clicar em um subtítulo
    if (subItem === 'Criar Tarefa') {
      navigation.navigate('CriaTarefa'); // Navega para CriaTarefa
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
        <MaterialIcons name="menu" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="slide"
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity style={styles.overlay} onPress={toggleMenu}>
          <View style={styles.menu}>
            {/* Tarefas com subtítulos */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress('Tarefas')}
            >
              <Text style={styles.menuItem}>Tarefas</Text>
            </TouchableOpacity>
            {expandedMenu === 'Tarefas' && (
              <View style={styles.subMenu}>
                <TouchableOpacity
                  style={styles.subMenuItemTouchable}
                  onPress={() => handleSubMenuItemPress('Criar Tarefa')}
                >
                  <Text style={styles.subMenuItem}>Criar Tarefa</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Categorias */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress('Categorias')}
            >
              <Text style={styles.menuItem}>Categorias</Text>
            </TouchableOpacity>

            {/* Notificações */}
            <TouchableOpacity
              style={styles.menuItemTouchable}
              onPress={() => handleMenuItemPress('Notificações')}
            >
              <Text style={styles.menuItem}>Notificações</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 29,
    left: 20,
    zIndex: 10,
  },
  menuButton: {
    backgroundColor: '#8B4513',
    padding: 10,
    borderRadius: 5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menu: {
    width: '50%',
    backgroundColor: '#D2B48C',
    padding: 20,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginTop: 29,
  },
  menuItemTouchable: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  menuItem: {
    fontSize: 18,
    color: '#F5F5DC',
    fontWeight: 'bold',
  },
  subMenu: {
    paddingLeft: 20, // Indenta os subtítulos
  },
  subMenuItemTouchable: {
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
  },
  subMenuItem: {
    fontSize: 16,
    color: '#F5F5DC',
  },
});
