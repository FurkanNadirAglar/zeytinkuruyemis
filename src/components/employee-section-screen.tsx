import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type EmployeeSectionScreenProps = {
  title: string;
  subtitle: string;
  badgeLabel: string;
  cardTitle: string;
  cardDescription: string;
  detailsTitle: string;
  detailsDescription: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children?: ReactNode;
};

export function EmployeeSectionScreen({
  title,
  subtitle,
  badgeLabel,
  cardTitle,
  cardDescription,
  detailsTitle,
  detailsDescription,
  actionLabel,
  onActionPress,
  children,
}: EmployeeSectionScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.heroSection}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <ThemedText type="title" style={styles.title}>
                  {title}
                </ThemedText>
                <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>
              </View>

              <View style={styles.roleBadge}>
                <ThemedText type="smallBold" style={styles.roleBadgeText}>
                  {badgeLabel}
                </ThemedText>
              </View>
            </View>

            <View style={styles.card}>
              <ThemedText type="subtitle" style={styles.primaryText}>
                {cardTitle}
              </ThemedText>
              <ThemedText style={styles.primaryText}>{cardDescription}</ThemedText>
            </View>

            <View style={styles.card}>
              <ThemedText type="smallBold" style={styles.primaryText}>
                {detailsTitle}
              </ThemedText>
              <ThemedText style={styles.secondaryText}>{detailsDescription}</ThemedText>

              {children}

              {actionLabel && onActionPress ? (
                <Pressable onPress={onActionPress} style={styles.actionButton}>
                  <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#F8F1E7',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.five,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Spacing.five,
  },
  heroSection: {
    width: '100%',
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
    color: '#2F1D0E',
  },
  roleBadge: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: '#3A240F',
  },
  roleBadgeText: {
    color: '#F6D18B',
  },
  card: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
    backgroundColor: '#FFF9F0',
    borderWidth: 1,
    borderColor: 'rgba(58, 36, 15, 0.08)',
  },
  primaryText: {
    color: '#2F1D0E',
  },
  secondaryText: {
    color: '#70533A',
  },
  actionButton: {
    marginTop: Spacing.one,
    backgroundColor: '#3A240F',
    borderRadius: Spacing.three,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#F6D18B',
    fontWeight: 700,
  },
});
