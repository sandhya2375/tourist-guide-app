import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Mountain, Waves, Church, Landmark, Sunrise, Ship } from 'lucide-react-native';
import { Category, Location } from '@/types/database';

const categoryIcons: Record<string, any> = {
  mountains: Mountain,
  beaches: Waves,
  temples: Church,
  monuments: Landmark,
  hills: Sunrise,
  oceans: Ship,
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularLocations, setPopularLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, locationsData] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('locations')
          .select('*')
          .order('visit_count', { ascending: false })
          .limit(10),
      ]);

      if (categoriesData.data) setCategories(categoriesData.data);
      if (locationsData.data) setPopularLocations(locationsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/search',
        params: { query: searchQuery },
      });
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/category',
      params: { id: categoryId },
    });
  };

  const handleLocationPress = (locationId: string) => {
    router.push({
      pathname: '/location',
      params: { id: locationId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile?.full_name || 'Traveler'}</Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{profile?.reward_points || 0} pts</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.name.toLowerCase()] || Mountain;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
              >
                <View style={styles.categoryIcon}>
                  <IconComponent size={28} color="#2563eb" strokeWidth={2} />
                </View>
                <Text style={styles.categoryName}>
                  {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {popularLocations.map((location) => (
          <TouchableOpacity
            key={location.id}
            style={styles.locationCard}
            onPress={() => handleLocationPress(location.id)}
          >
            <Image source={{ uri: location.image_url }} style={styles.locationImage} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>{location.name}</Text>
              <Text style={styles.locationCity}>
                {location.city}, {location.state}
              </Text>
              <View style={styles.locationMeta}>
                <View style={styles.ratingContainer}>
                  <Text style={styles.rating}>★ {location.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.visitCount}>{location.visit_count} visits</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  pointsBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 90,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
  },
  locationInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationCity: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingContainer: {
    marginRight: 12,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f59e0b',
  },
  visitCount: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
