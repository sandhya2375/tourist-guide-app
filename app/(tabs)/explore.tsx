import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MapPin } from 'lucide-react-native';

interface StateData {
  state: string;
  count: number;
}

const POPULAR_STATES = [
  'Rajasthan',
  'Kerala',
  'Goa',
  'Himachal Pradesh',
  'Uttarakhand',
  'Tamil Nadu',
  'Karnataka',
  'Maharashtra',
  'West Bengal',
  'Jammu and Kashmir',
  'Punjab',
  'Gujarat',
];

export default function ExploreScreen() {
  const [states, setStates] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('state')
        .order('state');

      if (error) throw error;

      const stateCounts = data.reduce((acc: Record<string, number>, item) => {
        acc[item.state] = (acc[item.state] || 0) + 1;
        return acc;
      }, {});

      const statesArray = Object.entries(stateCounts).map(([state, count]) => ({
        state,
        count,
      }));

      setStates(statesArray);
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatePress = (state: string) => {
    router.push({
      pathname: '/state',
      params: { state },
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
        <Text style={styles.title}>Explore India</Text>
        <Text style={styles.subtitle}>Discover destinations by state</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All States</Text>
        <View style={styles.statesGrid}>
          {POPULAR_STATES.map((state) => {
            const stateData = states.find((s) => s.state === state);
            const count = stateData?.count || 0;
            return (
              <TouchableOpacity
                key={state}
                style={styles.stateCard}
                onPress={() => handleStatePress(state)}
              >
                <View style={styles.stateIconContainer}>
                  <MapPin size={24} color="#2563eb" strokeWidth={2} />
                </View>
                <Text style={styles.stateName}>{state}</Text>
                <Text style={styles.locationCount}>
                  {count} {count === 1 ? 'location' : 'locations'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {states.filter((s) => !POPULAR_STATES.includes(s.state)).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other States</Text>
          <View style={styles.statesGrid}>
            {states
              .filter((s) => !POPULAR_STATES.includes(s.state))
              .map(({ state, count }) => (
                <TouchableOpacity
                  key={state}
                  style={styles.stateCard}
                  onPress={() => handleStatePress(state)}
                >
                  <View style={styles.stateIconContainer}>
                    <MapPin size={24} color="#2563eb" strokeWidth={2} />
                  </View>
                  <Text style={styles.stateName}>{state}</Text>
                  <Text style={styles.locationCount}>
                    {count} {count === 1 ? 'location' : 'locations'}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      )}
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
    padding: 20,
    paddingTop: 60,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  stateCard: {
    width: '46%',
    margin: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  stateIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
