import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ManagerSectionScreenProps = {
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

export function ManagerSectionScreen({
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
}: ManagerSectionScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>
                {title}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{subtitle}</ThemedText>
            </View>

            <ThemedView type="backgroundElement" style={styles.roleBadge}>
              <ThemedText type="smallBold">{badgeLabel}</ThemedText>
            </ThemedView>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">{cardTitle}</ThemedText>
            <ThemedText>{cardDescription}</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">{detailsTitle}</ThemedText>
            <ThemedText themeColor="textSecondary">{detailsDescription}</ThemedText>

            {children}

            {actionLabel && onActionPress ? (
              <Pressable onPress={onActionPress} style={styles.actionButton}>
                <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
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
  heroSection: {
    width: '100%',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: Spacing.five,
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
  },
  roleBadge: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  card: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  actionButton: {
    marginTop: Spacing.one,
    backgroundColor: '#1F6FEB',
    borderRadius: Spacing.three,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 700,
  },
});
