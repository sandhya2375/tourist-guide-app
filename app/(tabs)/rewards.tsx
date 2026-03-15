import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Trophy, Star, Gift, Target, TrendingUp } from 'lucide-react-native';
import { UserVisit } from '@/types/database';

interface RewardTier {
  name: string;
  minPoints: number;
  icon: any;
  color: string;
  bgColor: string;
}

const REWARD_TIERS: RewardTier[] = [
  { name: 'Explorer', minPoints: 0, icon: Star, color: '#9ca3af', bgColor: '#f3f4f6' },
  { name: 'Adventurer', minPoints: 100, icon: Target, color: '#10b981', bgColor: '#d1fae5' },
  { name: 'Wanderer', minPoints: 500, icon: TrendingUp, color: '#3b82f6', bgColor: '#dbeafe' },
  { name: 'Legend', minPoints: 1000, icon: Trophy, color: '#f59e0b', bgColor: '#fef3c7' },
];

export default function RewardsScreen() {
  const [recentVisits, setRecentVisits] = useState<UserVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    loadRecentVisits();
  }, []);

  const loadRecentVisits = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('user_visits')
        .select('*')
        .eq('user_id', profile.id)
        .order('visited_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentVisits(data || []);
    } catch (error) {
      console.error('Error loading recent visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    const points = profile?.reward_points || 0;
    return REWARD_TIERS.slice()
      .reverse()
      .find((tier) => points >= tier.minPoints) || REWARD_TIERS[0];
  };

  const getNextTier = () => {
    const points = profile?.reward_points || 0;
    return REWARD_TIERS.find((tier) => points < tier.minPoints);
  };

  const getProgressToNextTier = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    const points = profile?.reward_points || 0;

    if (!nextTier) return 100;

    const progress = ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const CurrentTierIcon = currentTier.icon;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.subtitle}>Track your travel achievements</Text>
      </View>

      <View style={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <View>
            <Text style={styles.pointsLabel}>Total Points</Text>
            <Text style={styles.pointsValue}>{profile?.reward_points || 0}</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: currentTier.bgColor }]}>
            <CurrentTierIcon size={24} color={currentTier.color} strokeWidth={2} />
          </View>
        </View>

        <View style={styles.tierInfo}>
          <View style={styles.tierInfoRow}>
            <Text style={styles.tierLabel}>Current Tier</Text>
            <Text style={[styles.tierName, { color: currentTier.color }]}>
              {currentTier.name}
            </Text>
          </View>
          {nextTier && (
            <>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressToNextTier()}%`, backgroundColor: nextTier.color },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {nextTier.minPoints - (profile?.reward_points || 0)} points to {nextTier.name}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to Earn Points</Text>
        <View style={styles.earnCard}>
          <View style={styles.earnItem}>
            <View style={styles.earnIconContainer}>
              <Target size={20} color="#2563eb" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Visit a Location</Text>
              <Text style={styles.earnDescription}>Earn 10 points per visit</Text>
            </View>
            <Text style={styles.earnPoints}>+10</Text>
          </View>
          <View style={styles.earnDivider} />
          <View style={styles.earnItem}>
            <View style={styles.earnIconContainer}>
              <Star size={20} color="#2563eb" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Rate a Location</Text>
              <Text style={styles.earnDescription}>Share your experience</Text>
            </View>
            <Text style={styles.earnPoints}>+5</Text>
          </View>
          <View style={styles.earnDivider} />
          <View style={styles.earnItem}>
            <View style={styles.earnIconContainer}>
              <Gift size={20} color="#2563eb" />
            </View>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>Daily Login</Text>
              <Text style={styles.earnDescription}>Coming soon</Text>
            </View>
            <Text style={styles.earnPoints}>+2</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentVisits.length > 0 ? (
          <View style={styles.activityList}>
            {recentVisits.map((visit) => (
              <View key={visit.id} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Award size={20} color="#10b981" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>Location Visit</Text>
                  <Text style={styles.activityDate}>
                    {new Date(visit.visited_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.activityPoints}>+{visit.points_earned}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Award size={48} color="#d1d5db" strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>No activity yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Visit locations to start earning points!
            </Text>
          </View>
        )}
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
  pointsCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
  },
  tierBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: {
    marginTop: 12,
  },
  tierInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
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
  earnCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  earnIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  earnDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  earnPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  earnDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  activityList: {
    marginHorizontal: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  activityPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
