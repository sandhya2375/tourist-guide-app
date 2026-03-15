import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, MapPin, Star, Heart, Calendar, Cloud, Hotel, UtensilsCrossed, Car, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import { Location } from '@/types/database';

export default function LocationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadLocation();
      checkFavoriteStatus();
      checkVisitStatus();
    }
  }, [id]);

  const loadLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setLocation(data);
    } catch (error) {
      console.error('Error loading location:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', profile.id)
        .eq('location_id', id)
        .maybeSingle();

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const checkVisitStatus = async () => {
    if (!profile) return;

    try {
      const { data } = await supabase
        .from('user_visits')
        .select('id')
        .eq('user_id', profile.id)
        .eq('location_id', id)
        .maybeSingle();

      setHasVisited(!!data);
    } catch (error) {
      console.error('Error checking visit:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!profile) return;

    try {
      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', profile.id)
          .eq('location_id', id);
        setIsFavorite(false);
      } else {
        await supabase.from('user_favorites').insert({
          user_id: profile.id,
          location_id: id,
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const markAsVisited = async () => {
    if (!profile || hasVisited) return;

    try {
      await supabase.from('user_visits').insert({
        user_id: profile.id,
        location_id: id,
        points_earned: 10,
      });

      setHasVisited(true);
      await refreshProfile();
    } catch (error) {
      console.error('Error marking as visited:', error);
    }
  };

  const openUber = () => {
    if (!location?.latitude || !location?.longitude) return;

    const url = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${location.latitude}&dropoff[longitude]=${location.longitude}&dropoff[nickname]=${encodeURIComponent(location.name)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${location.latitude}&dropoff[longitude]=${location.longitude}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const searchNearby = (type: 'hotels' | 'restaurants') => {
    if (!location) return;

    const query = type === 'hotels'
      ? `hotels near ${location.name}, ${location.city}`
      : `restaurants near ${location.name}, ${location.city}`;

    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Location not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: location.image_url }} style={styles.image} />
          <View style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
              <Heart
                size={24}
                color={isFavorite ? '#ef4444' : '#fff'}
                fill={isFavorite ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{location.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={16} color="#6b7280" />
                <Text style={styles.locationText}>
                  {location.city}, {location.state}
                </Text>
              </View>
            </View>
            <View style={styles.ratingContainer}>
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{location.rating.toFixed(1)}</Text>
            </View>
          </View>

          {!hasVisited && (
            <TouchableOpacity style={styles.visitButton} onPress={markAsVisited}>
              <CheckCircle2 size={20} color="#fff" />
              <Text style={styles.visitButtonText}>Mark as Visited (+10 pts)</Text>
            </TouchableOpacity>
          )}

          {hasVisited && (
            <View style={styles.visitedBadge}>
              <CheckCircle2 size={20} color="#10b981" />
              <Text style={styles.visitedText}>You visited this place</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{location.description}</Text>
          </View>

          {location.best_season && (
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Calendar size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Best Season</Text>
                <Text style={styles.infoValue}>{location.best_season}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Cloud size={20} color="#2563eb" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Weather Info</Text>
              <Text style={styles.infoValue}>Check current conditions</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => searchNearby('hotels')}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Hotel size={24} color="#2563eb" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Nearby Hotels</Text>
                <Text style={styles.serviceDescription}>Find accommodation nearby</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => searchNearby('restaurants')}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: '#dcfce7' }]}>
                <UtensilsCrossed size={24} color="#10b981" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Nearby Restaurants</Text>
                <Text style={styles.serviceDescription}>Explore local dining options</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} onPress={openUber}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Car size={24} color="#f59e0b" />
              </View>
              <View style={styles.serviceContent}>
                <Text style={styles.serviceTitle}>Book Uber</Text>
                <Text style={styles.serviceDescription}>Get a ride to this location</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  imageContainer: {
    height: 320,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 15,
    color: '#6b7280',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 4,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  visitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  visitedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6b7280',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});
