import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert, TextInput
} from 'react-native';
// 📦 Import des modules externes (Module 4 & 5)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clé pour le stockage local
const FAVORITES_KEY = '@my_favorites_ids';

export default function App() {
  // --- ÉTATS (STATE) ---
  const [users, setUsers] = useState([]); // Données API
  const [favorites, setFavorites] = useState([]); // Liste des ID favoris
  const [isLoading, setIsLoading] = useState(true); // Indicateur de chargement
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // Filtre favoris
  const [newUserName, setNewUserName] = useState(''); // Nom du nouvel utilisateur
  const [newUserEmail, setNewUserEmail] = useState(''); // Email du nouvel utilisateur

  // --- CYCLE DE VIE (EFFECTS) ---
  useEffect(() => {
    loadData();
  }, []); // [] = S'exécute une seule fois au montage

  // --- LOGIQUE MÉTIER ---
  // 1. Fonction pour charger les données (API + Storage)
  const loadData = async () => {
    setIsLoading(true);
    try {
      // A. Appel API avec Axios (Module 4)
      const response = await axios.get('https://jsonplaceholder.typicode.com/users');
      setUsers(response.data);

      // B. Chargement des favoris locaux (Module 5)
      const storedFavs = await AsyncStorage.getItem(FAVORITES_KEY);
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs)); // Conversion JSON -> Tableau
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les données");
      console.error(error);
    } finally {
      setIsLoading(false); // Arrêt du chargement quoi qu'il arrive
    }
  };

  // 2. Gestion des Favoris (Ajout/Retrait + Persistance)
  const toggleFavorite = async (userId) => {
    try {
      let newFavorites;
      if (favorites.includes(userId)) {
        // Si déjà favori, on le retire
        newFavorites = favorites.filter(id => id !== userId);
      } else {
        // Sinon, on l'ajoute
        newFavorites = [...favorites, userId];
      }

      // Mise à jour du State (Interface réactive)
      setFavorites(newFavorites);

      // Mise à jour du Storage (Persistance)
      // JSON.stringify est obligatoire car AsyncStorage ne stocke que des Strings
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
    }
  };

  // 3. Défi "Sécurité" - Effacer tout
  const clearAllData = async () => {
    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment effacer tous les favoris ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(FAVORITES_KEY);
              setFavorites([]);
              Alert.alert("Succès", "Tous les favoris ont été effacés");
            } catch (error) {
              console.error("Erreur lors de l'effacement", error);
              Alert.alert("Erreur", "Impossible d'effacer les données");
            }
          }
        }
      ]
    );
  };

  // 4. Défi "API POST" - Ajouter un utilisateur
  const addUser = async () => {
    // Validation
    if (!newUserName.trim() || !newUserEmail.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    try {
      // Appel POST à l'API
      const response = await axios.post('https://jsonplaceholder.typicode.com/users', {
        name: newUserName,
        email: newUserEmail,
        username: newUserName.toLowerCase().replace(/\s+/g, ''),
        phone: "000-000-0000",
        website: "example.com",
        company: { name: "Ma Société" }
      });

      // L'API renvoie l'utilisateur avec un ID
      const newUser = response.data;
      
      // Ajouter à la liste locale (en début de liste)
      setUsers([newUser, ...users]);
      
      // Réinitialiser le formulaire
      setNewUserName('');
      setNewUserEmail('');
      
      Alert.alert("Succès", `Utilisateur ${newUser.name} ajouté avec l'ID ${newUser.id}`);
    } catch (error) {
      console.error("Erreur lors de l'ajout", error);
      Alert.alert("Erreur", "Impossible d'ajouter l'utilisateur");
    }
  };

  // 5. Défi "Filtrage" - Filtrer les utilisateurs
  const getFilteredUsers = () => {
    if (showFavoritesOnly) {
      return users.filter(user => favorites.includes(user.id));
    }
    return users;
  };

  // --- RENDU GRAPHIQUE (RENDER) ---
  // Composant pour un item de la liste
  const renderItem = ({ item }) => {
    const isFav = favorites.includes(item.id);
    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={[styles.favButton, isFav ? styles.favActive : styles.favInactive]}
        >
          <Text style={styles.favText}>{isFav ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Affichage principal
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Mon Répertoire API</Text>
      
      {isLoading ? (
        // Affichage du spinner pendant le chargement
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Chargement des contacts...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Défi POST - Formulaire d'ajout */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>➕ Ajouter un utilisateur</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom complet"
              value={newUserName}
              onChangeText={setNewUserName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={newUserEmail}
              onChangeText={setNewUserEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addButton} onPress={addUser}>
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {/* Boutons de contrôle */}
          <View style={styles.controlButtons}>
            {/* Défi Filtrage - Bouton filtre favoris */}
            <TouchableOpacity
              style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Text style={styles.filterButtonText}>
                {showFavoritesOnly ? '📋 Tous' : '⭐ Favoris uniquement'}
              </Text>
            </TouchableOpacity>

            {/* Défi Sécurité - Bouton effacer tout */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAllData}
            >
              <Text style={styles.clearButtonText}>🗑️ Effacer tout</Text>
            </TouchableOpacity>
          </View>

          {/* Liste des utilisateurs */}
          <FlatList
            data={getFilteredUsers()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {showFavoritesOnly 
                    ? '⭐ Aucun favori pour le moment' 
                    : '📭 Aucun utilisateur'}
                </Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 40 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  controlButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f1c40f',
  },
  filterButtonActive: {
    backgroundColor: '#fff3cd',
  },
  filterButtonText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  clearButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  clearButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2, // Ombre Android
    shadowColor: '#000', // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  favButton: { padding: 10, borderRadius: 20 },
  favActive: { backgroundColor: '#fff3cd' }, // Jaune clair
  favInactive: { backgroundColor: '#f0f0f0' }, // Gris clair
  favText: { fontSize: 24, color: '#f1c40f' },
});
