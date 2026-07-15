import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { BranchCountRecord, subscribeBranchCount } from '@/lib/branch-counts';
import { Branch, subscribeBranches } from '@/lib/branches';
import { Product, subscribeProducts } from '@/lib/products';

export default function EmployeeHomeScreen() {
  const router = useRouter();
  const { selectedBranch, setSelectedBranch } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchCount, setBranchCount] = useState<BranchCountRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [isBranchPickerOpen, setIsBranchPickerOpen] = useState(false);

  useEffect(() => {
    const unsubscribeBranches = subscribeBranches(
      (items) => {
        setBranches(items);
        setScreenError('');
        setIsLoading(false);
      },
      (loadError) => {
        setScreenError(loadError.message || 'Subeler alinirken bir hata olustu.');
        setIsLoading(false);
      },
    );

    const unsubscribeProducts = subscribeProducts(
      (items) => {
        setProducts(items);
        setIsProductsLoading(false);
      },
      () => {
        setIsProductsLoading(false);
      },
    );

    return () => {
      unsubscribeBranches();
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    if (!selectedBranch) {
      return;
    }

    const unsubscribe = subscribeBranchCount(selectedBranch.id, (record) => {
      setBranchCount(record);
    });

    return unsubscribe;
  }, [selectedBranch]);

  const activeBranchCount = selectedBranch ? branchCount : null;

  const summary = useMemo(() => {
    const items = activeBranchCount?.items ?? [];
    const countedItems = items.filter((item) => item.totalKg > 0);
    const totalProducts = products.length;
    const countedProducts = countedItems.length;
    const remainingProducts = Math.max(totalProducts - countedProducts, 0);
    const totalKg = countedItems.reduce((sum, item) => sum + item.totalKg, 0);
    const progress = totalProducts > 0 ? countedProducts / totalProducts : 0;
    const recentItems = [...countedItems].sort((a, b) => b.totalKg - a.totalKg).slice(0, 3);

    return {
      totalProducts,
      countedProducts,
      remainingProducts,
      totalKg,
      progress,
      recentItems,
    };
  }, [activeBranchCount, products]);

  const isBusy = isLoading || isProductsLoading;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.page}>
          <View style={styles.headerBanner}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Menu"
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
                  size={20}
                  tintColor="#FFF7EE"
                />
              </Pressable>

              <ThemedText type="smallBold" style={styles.topBarTitle}>
                Ana Sayfa
              </ThemedText>

              <Pressable
                accessibilityLabel="Bildirimler"
                onPress={() => router.push('/profil')}
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications_none', web: 'notifications' }}
                  size={20}
                  tintColor="#FFF7EE"
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <ThemedView type="backgroundElement" style={styles.greetingCard}>
              <View style={styles.greetingTextWrap}>
                <ThemedText style={styles.greetingLabel}>Merhaba,</ThemedText>
                <ThemedText type="smallBold" style={styles.greetingName}>
                  Calisan
                </ThemedText>
              </View>

              <Pressable
                onPress={() => router.push('/profil')}
                style={({ pressed }) => [styles.avatarButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
                  size={34}
                  tintColor="#D79C2D"
                />
              </Pressable>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.branchCard}>
              <ThemedText style={styles.branchLabel}>Sube</ThemedText>
              <Pressable
                onPress={() => setIsBranchPickerOpen((current) => !current)}
                style={({ pressed }) => [styles.branchSelector, pressed && styles.pressedButton]}>
                <ThemedText type="smallBold" style={styles.branchValue} numberOfLines={1}>
                  {selectedBranch?.name ?? 'Sube sec'}
                </ThemedText>
                <SymbolView
                  name={{
                    ios: isBranchPickerOpen ? 'chevron.up' : 'chevron.right',
                    android: isBranchPickerOpen ? 'expand_less' : 'chevron_right',
                    web: isBranchPickerOpen ? 'expand_less' : 'chevron_right',
                  }}
                  size={18}
                  tintColor="#7B6049"
                />
              </Pressable>

              {isBranchPickerOpen ? (
                <View style={styles.branchDropdown}>
                  {isLoading ? (
                    <View style={styles.centerState}>
                      <ActivityIndicator color="#D9A028" />
                      <ThemedText themeColor="textSecondary">Subeler yukleniyor...</ThemedText>
                    </View>
                  ) : screenError ? (
                    <View style={styles.centerState}>
                      <ThemedText type="smallBold" style={styles.errorText}>
                        Sube listesi yuklenemedi
                      </ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.helperText}>
                        {screenError}
                      </ThemedText>
                    </View>
                  ) : branches.length === 0 ? (
                    <View style={styles.centerState}>
                      <ThemedText type="smallBold">Henuz sube bulunmuyor.</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.helperText}>
                        Mudur tarafinda sube eklendiginde burada listelenecek.
                      </ThemedText>
                    </View>
                  ) : (
                    branches.map((branch) => {
                      const isSelected = selectedBranch?.id === branch.id;

                      return (
                        <Pressable
                          key={branch.id}
                          onPress={() => {
                            setSelectedBranch(branch);
                            setIsBranchPickerOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.branchOption,
                            isSelected && styles.branchOptionSelected,
                            pressed && styles.pressedButton,
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={[
                              styles.branchOptionText,
                              isSelected && styles.branchOptionTextSelected,
                            ]}>
                            {branch.name}
                          </ThemedText>
                          {isSelected ? (
                            <SymbolView
                              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                              size={16}
                              tintColor="#D79C2D"
                            />
                          ) : null}
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}
            </ThemedView>

            <View style={styles.summaryCard}>
              <View style={styles.summaryTextWrap}>
                <ThemedText type="smallBold" style={styles.summaryTitle}>
                  Bugunku Sayim
                </ThemedText>
                <ThemedText style={styles.summaryDate}>{formatToday()}</ThemedText>
                <ThemedText style={styles.summaryBranch} numberOfLines={1}>
                  {selectedBranch?.name ?? 'Sube secilmedi'}
                </ThemedText>
              </View>

              <View style={styles.progressWrap}>
                <View style={styles.progressCircle}>
                  <View style={styles.progressCircleInner}>
                    <ThemedText style={styles.progressText}>
                      %{Math.round(summary.progress * 100)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.progressLabel}>Sayim Durumu</ThemedText>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Toplam Urun" value={String(summary.totalProducts)} />
              <StatCard label="Toplam Kg" value={formatKg(summary.totalKg)} />
              <StatCard label="Sayimi Yapilan" value={String(summary.countedProducts)} />
              <StatCard label="Kalan Urun" value={String(summary.remainingProducts)} />
            </View>

            <Pressable
              disabled={!selectedBranch || isBusy}
              onPress={() => router.push('/sayim')}
              style={({ pressed }) => [
                styles.primaryButton,
                (!selectedBranch || isBusy) && styles.primaryButtonDisabled,
                pressed && selectedBranch && !isBusy && styles.pressedButton,
              ]}>
              <ThemedText style={styles.primaryButtonText}>Sayima Devam Et</ThemedText>
            </Pressable>

            <ThemedView type="backgroundElement" style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <ThemedText type="smallBold" style={styles.activityTitle}>
                  Son Hareketler
                </ThemedText>
                <Pressable onPress={() => router.push('/sayim')}>
                  <ThemedText style={styles.activityLink}>Tumu</ThemedText>
                </Pressable>
              </View>

              {isBusy ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#D9A028" />
                  <ThemedText themeColor="textSecondary">Veriler hazirlaniyor...</ThemedText>
                </View>
              ) : summary.recentItems.length === 0 ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold">Henuz kaydedilmis sayim yok.</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.helperText}>
                    Sube secip sayim ekranindan veri girdiginde burada gosterilecek.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.activityList}>
                  {summary.recentItems.map((item, index) => (
                    <View
                      key={item.productId}
                      style={[
                        styles.activityRow,
                        index !== summary.recentItems.length - 1 && styles.activityRowBorder,
                      ]}>
                      <View style={styles.activityTextWrap}>
                        <ThemedText type="smallBold" style={styles.activityItemName} numberOfLines={1}>
                          {item.productName}
                        </ThemedText>
                        <ThemedText style={styles.activityItemMeta} numberOfLines={1}>
                          {formatKg(item.totalKg)} kg
                        </ThemedText>
                      </View>

                      <ThemedText style={styles.activityValue}>
                        {formatMovement(item.rawKg, item.roastedKg)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </ThemedView>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
      <ThemedText type="subtitle" style={styles.statValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function formatToday() {
  return new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

function formatKg(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatMovement(rawKg: number, roastedKg: number) {
  if (rawKg > 0 && roastedKg > 0) {
    return `C ${formatKg(rawKg)} | K ${formatKg(roastedKg)}`;
  }

  if (rawKg > 0) {
    return `+${formatKg(rawKg)}`;
  }

  if (roastedKg > 0) {
    return `+${formatKg(roastedKg)}`;
  }

  return '0';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F0E7',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  headerBanner: {
    backgroundColor: '#2F1D0E',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  topBar: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#FFF7EE',
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: 12,
  },
  greetingCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFE1D1',
    backgroundColor: '#FFFDF9',
  },
  greetingTextWrap: {
    gap: 2,
  },
  greetingLabel: {
    color: '#7A6450',
    fontSize: 15,
  },
  greetingName: {
    color: '#2E2117',
    fontSize: 28,
    lineHeight: 32,
  },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7EA',
    borderWidth: 1,
    borderColor: '#E8C98E',
  },
  branchCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#EFE1D1',
    backgroundColor: '#FFFDF9',
    gap: 10,
  },
  branchLabel: {
    color: '#8A735F',
    fontSize: 13,
  },
  branchSelector: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  branchValue: {
    flex: 1,
    color: '#2E2117',
    fontSize: 18,
  },
  branchDropdown: {
    gap: 8,
    paddingTop: 6,
  },
  branchOption: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F4EE',
    borderWidth: 1,
    borderColor: '#EBDDCB',
  },
  branchOptionSelected: {
    backgroundColor: '#FFF6E7',
    borderColor: '#E3BD72',
  },
  branchOptionText: {
    color: '#2E2117',
  },
  branchOptionTextSelected: {
    color: '#6C4A18',
  },
  summaryCard: {
    minHeight: 132,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2F1D0E',
  },
  summaryTextWrap: {
    flex: 1,
    gap: 6,
    paddingRight: 12,
  },
  summaryTitle: {
    color: '#FFF7EE',
    fontSize: 18,
  },
  summaryDate: {
    color: '#E7D5C0',
    fontSize: 13,
  },
  summaryBranch: {
    color: '#D9A028',
    fontSize: 13,
    fontWeight: 700,
  },
  progressWrap: {
    alignItems: 'center',
    gap: 8,
  },
  progressCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#D9A028',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  progressCircleInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A240F',
  },
  progressText: {
    color: '#FFF7EE',
    fontSize: 18,
    fontWeight: 800,
  },
  progressLabel: {
    color: '#E7D5C0',
    fontSize: 12,
    fontWeight: 700,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    minHeight: 98,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFE1D1',
    backgroundColor: '#FFFDF9',
  },
  statLabel: {
    color: '#9A8776',
    fontSize: 13,
  },
  statValue: {
    color: '#2E2117',
    fontSize: 22,
    lineHeight: 26,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#D9A028',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: 15,
  },
  activityCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EFE1D1',
    backgroundColor: '#FFFDF9',
    gap: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    color: '#2E2117',
  },
  activityLink: {
    color: '#C7902A',
    fontWeight: 700,
    fontSize: 14,
  },
  activityList: {
    gap: 2,
  },
  activityRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E5D8',
  },
  activityTextWrap: {
    flex: 1,
    gap: 2,
  },
  activityItemName: {
    color: '#2E2117',
    fontSize: 14,
  },
  activityItemMeta: {
    color: '#8C7764',
    fontSize: 13,
  },
  activityValue: {
    color: '#5FA467',
    fontWeight: 800,
    fontSize: 13,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  helperText: {
    textAlign: 'center',
  },
  errorText: {
    color: '#C83D3D',
  },
  pressedButton: {
    opacity: 0.82,
  },
});
