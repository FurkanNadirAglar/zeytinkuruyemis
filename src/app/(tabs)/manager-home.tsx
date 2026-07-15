import { useEffect, useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { BranchCountRecord, subscribeBranchCounts } from '@/lib/branch-counts';
import { Branch, subscribeBranches } from '@/lib/branches';
import { Product, subscribeProducts } from '@/lib/products';

const ALL_BRANCHES_FILTER = 'all';

export default function ManagerHomeScreen() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchCounts, setBranchCounts] = useState<BranchCountRecord[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(ALL_BRANCHES_FILTER);
  const [isBranchFilterOpen, setIsBranchFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screenError, setScreenError] = useState('');

  useEffect(() => {
    const unsubscribeBranches = subscribeBranches(
      (items) => {
        setBranches(items);
        setIsLoading(false);
        setScreenError('');
      },
      (loadError) => {
        setScreenError(loadError.message || 'Subeler alinirken bir hata olustu.');
        setIsLoading(false);
      },
    );

    const unsubscribeProducts = subscribeProducts(
      (items) => {
        setProducts(items);
      },
      () => {
        // Products are auxiliary for progress calculations.
      },
    );

    const unsubscribeBranchCounts = subscribeBranchCounts(
      (records) => {
        setBranchCounts(records);
      },
      (loadError) => {
        setScreenError(loadError.message || 'Sube sayimlari alinirken bir hata olustu.');
      },
    );

    return () => {
      unsubscribeBranches();
      unsubscribeProducts();
      unsubscribeBranchCounts();
    };
  }, []);

  const filteredBranchCounts = useMemo(() => {
    if (selectedBranchId === ALL_BRANCHES_FILTER) {
      return branchCounts;
    }

    return branchCounts.filter((record) => record.branchId === selectedBranchId);
  }, [branchCounts, selectedBranchId]);

  const selectedBranchName = useMemo(() => {
    if (selectedBranchId === ALL_BRANCHES_FILTER) {
      return 'Tum Subeler';
    }

    return branches.find((branch) => branch.id === selectedBranchId)?.name ?? 'Sube sec';
  }, [branches, selectedBranchId]);

  const dashboard = useMemo(() => {
    const branchCount = selectedBranchId === ALL_BRANCHES_FILTER ? branches.length : filteredBranchCounts.length;
    const totalProducts = filteredBranchCounts.reduce((sum, record) => sum + record.items.length, 0);
    const totalKg = filteredBranchCounts.reduce(
      (sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.totalKg, 0),
      0,
    );
    const totalPurchaseAmount = filteredBranchCounts.reduce(
      (sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.totalAmount, 0),
      0,
    );
    const totalSaleAmount = filteredBranchCounts.reduce(
      (sum, record) =>
        sum +
        record.items.reduce(
          (itemSum, item) => itemSum + item.salePrice * item.totalKg,
          0,
        ),
      0,
    );
    const totalProfit = totalSaleAmount - totalPurchaseAmount;

    const branchPerformance = filteredBranchCounts
      .map((record) => {
        const itemCount = record.items.length;
        const progress = products.length > 0 ? itemCount / products.length : 0;
        const saleAmount = record.items.reduce(
          (sum, item) => sum + item.salePrice * item.totalKg,
          0,
        );

        return {
          branchId: record.branchId,
          branchName: record.branchName,
          progress,
          saleAmount,
        };
      })
      .sort((left, right) => right.saleAmount - left.saleAmount);

    return {
      branchCount,
      totalProducts,
      totalKg,
      totalPurchaseAmount,
      totalSaleAmount,
      totalProfit,
      profitRate: totalPurchaseAmount > 0 ? (totalProfit / totalPurchaseAmount) * 100 : 0,
      branchPerformance,
    };
  }, [branches.length, filteredBranchCounts, products.length, selectedBranchId]);

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
                Dashboard
              </ThemedText>

              <Pressable
                accessibilityLabel="Bildirimler"
                onPress={() => router.push('/ayarlar')}
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
            <View style={styles.filterRow}>
              <View style={styles.filterCell}>
                <Pressable
                  onPress={() => setIsBranchFilterOpen((current) => !current)}
                  style={({ pressed }) => [styles.filterButton, pressed && styles.pressedButton]}>
                  <View style={styles.filterTextWrap}>
                    <SymbolView
                      name={{ ios: 'building.2', android: 'storefront', web: 'storefront' }}
                      size={16}
                      tintColor="#B58A4B"
                    />
                    <ThemedText type="smallBold" style={styles.filterText} numberOfLines={1}>
                      {selectedBranchName}
                    </ThemedText>
                  </View>
                  <SymbolView
                    name={{
                      ios: isBranchFilterOpen ? 'chevron.up' : 'chevron.down',
                      android: isBranchFilterOpen ? 'expand_less' : 'expand_more',
                      web: isBranchFilterOpen ? 'expand_less' : 'expand_more',
                    }}
                    size={16}
                    tintColor="#7B6049"
                  />
                </Pressable>

                {isBranchFilterOpen ? (
                  <ThemedView type="backgroundElement" style={styles.dropdownCard}>
                    <Pressable
                      onPress={() => {
                        setSelectedBranchId(ALL_BRANCHES_FILTER);
                        setIsBranchFilterOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        selectedBranchId === ALL_BRANCHES_FILTER && styles.dropdownItemSelected,
                        pressed && styles.pressedButton,
                      ]}>
                      <ThemedText
                        type="smallBold"
                        style={[
                          styles.dropdownItemText,
                          selectedBranchId === ALL_BRANCHES_FILTER && styles.dropdownItemTextSelected,
                        ]}>
                        Tum Subeler
                      </ThemedText>
                    </Pressable>

                    {branches.map((branch) => {
                      const isSelected = selectedBranchId === branch.id;

                      return (
                        <Pressable
                          key={branch.id}
                          onPress={() => {
                            setSelectedBranchId(branch.id);
                            setIsBranchFilterOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.dropdownItem,
                            isSelected && styles.dropdownItemSelected,
                            pressed && styles.pressedButton,
                          ]}>
                          <ThemedText
                            type="smallBold"
                            style={[
                              styles.dropdownItemText,
                              isSelected && styles.dropdownItemTextSelected,
                            ]}>
                            {branch.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </ThemedView>
                ) : null}
              </View>

              <Pressable style={({ pressed }) => [styles.filterButton, styles.dateButton, pressed && styles.pressedButton]}>
                <ThemedText type="smallBold" style={styles.filterText}>
                  {formatTodayShort()}
                </ThemedText>
                <SymbolView
                  name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                  size={16}
                  tintColor="#7B6049"
                />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color="#D9911A" />
                <ThemedText themeColor="textSecondary">Dashboard yukleniyor...</ThemedText>
              </View>
            ) : screenError ? (
              <View style={styles.centerState}>
                <ThemedText type="smallBold" style={styles.errorText}>
                  Dashboard yuklenemedi
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.helperText}>
                  {screenError}
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.statsGridThree}>
                  <TopStatCard label="Toplam Sube" value={String(dashboard.branchCount)} />
                  <TopStatCard label="Toplam Urun" value={formatInteger(dashboard.totalProducts)} />
                  <TopStatCard label="Toplam Kg" value={formatKg(dashboard.totalKg)} />
                </View>

                <View style={styles.statsGridTwo}>
                  <WideStatCard
                    label="Toplam Alis Tutari"
                    value={`${formatCurrency(dashboard.totalPurchaseAmount)} ₺`}
                  />
                  <WideStatCard
                    label="Toplam Satis Tutari"
                    value={`${formatCurrency(dashboard.totalSaleAmount)} ₺`}
                  />
                </View>

                <ThemedView type="backgroundElement" style={styles.profitCard}>
                  <ThemedText style={styles.profitLabel}>Toplam Kar</ThemedText>
                  <View style={styles.profitRow}>
                    <ThemedText style={styles.profitValue}>
                      {formatCurrency(dashboard.totalProfit)} ₺
                    </ThemedText>
                    <ThemedText style={styles.profitRate}>
                      {dashboard.profitRate >= 0 ? '↑' : '↓'} %{formatSignedPercent(dashboard.profitRate)}
                    </ThemedText>
                  </View>
                </ThemedView>

                <ThemedView type="backgroundElement" style={styles.performanceCard}>
                  <View style={styles.performanceHeader}>
                    <ThemedText type="smallBold" style={styles.performanceTitle}>
                      Sube Bazli Performans
                    </ThemedText>
                    <Pressable onPress={() => router.push('/reportlar')}>
                      <ThemedText style={styles.performanceLink}>Tumu</ThemedText>
                    </Pressable>
                  </View>

                  {dashboard.branchPerformance.length === 0 ? (
                    <View style={styles.centerState}>
                      <ThemedText type="smallBold">Henuz sayim kaydi bulunmuyor.</ThemedText>
                      <ThemedText themeColor="textSecondary" style={styles.helperText}>
                        Calisanlar sube bazli sayim kaydettiginde burada listelenecek.
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.performanceList}>
                      {dashboard.branchPerformance.map((item, index) => (
                        <View
                          key={item.branchId}
                          style={[
                            styles.performanceRow,
                            index !== dashboard.branchPerformance.length - 1 && styles.performanceRowBorder,
                          ]}>
                          <View style={styles.performanceNameWrap}>
                            <ThemedText type="smallBold" style={styles.performanceName} numberOfLines={1}>
                              {item.branchName}
                            </ThemedText>
                          </View>

                          <View style={styles.performanceBarWrap}>
                            <View style={styles.performanceBarTrack}>
                              <View
                                style={[
                                  styles.performanceBarFill,
                                  {
                                    width: `${Math.min(item.progress * 100, 100)}%`,
                                    backgroundColor: getProgressColor(item.progress),
                                  },
                                ]}
                              />
                            </View>
                            <ThemedText style={styles.performancePercent}>
                              %{Math.round(item.progress * 100)}
                            </ThemedText>
                          </View>

                          <ThemedText style={styles.performanceAmount}>
                            {formatCurrency(item.saleAmount)} ₺
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </ThemedView>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function TopStatCard({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.topStatCard}>
      <ThemedText style={styles.topStatLabel}>{label}</ThemedText>
      <ThemedText type="subtitle" style={styles.topStatValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function WideStatCard({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.wideStatCard}>
      <ThemedText style={styles.topStatLabel}>{label}</ThemedText>
      <ThemedText type="subtitle" style={styles.wideStatValue}>
        {value}
      </ThemedText>
    </ThemedView>
  );
}

function formatTodayShort() {
  return new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatInteger(value: number) {
  return value.toLocaleString('tr-TR', {
    maximumFractionDigits: 0,
  });
}

function formatKg(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSignedPercent(value: number) {
  return Math.abs(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function getProgressColor(progress: number) {
  if (progress >= 0.8) {
    return '#43A047';
  }

  if (progress >= 0.4) {
    return '#F59E0B';
  }

  return '#F4511E';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F1E8',
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
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
  },
  filterCell: {
    flex: 1,
  },
  filterButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEDFD0',
    backgroundColor: '#FFFDF9',
  },
  filterTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    flex: 1,
    color: '#2E2117',
    fontSize: 14,
  },
  dateButton: {
    flex: 1,
  },
  dropdownCard: {
    marginTop: 8,
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EEDFD0',
    backgroundColor: '#FFFDF9',
    gap: 6,
  },
  dropdownItem: {
    minHeight: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#F9F3EB',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF5E3',
  },
  dropdownItemText: {
    color: '#2E2117',
  },
  dropdownItemTextSelected: {
    color: '#A96B1C',
  },
  statsGridThree: {
    flexDirection: 'row',
    gap: 10,
  },
  topStatCard: {
    flex: 1,
    minHeight: 108,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEE0D1',
    backgroundColor: '#FFFDF9',
  },
  topStatLabel: {
    color: '#8F7B69',
    fontSize: 13,
  },
  topStatValue: {
    color: '#21160E',
    fontSize: 20,
    lineHeight: 24,
  },
  statsGridTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  wideStatCard: {
    flex: 1,
    minHeight: 108,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEE0D1',
    backgroundColor: '#FFFDF9',
  },
  wideStatValue: {
    color: '#21160E',
    fontSize: 18,
    lineHeight: 22,
  },
  profitCard: {
    minHeight: 108,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEE0D1',
    backgroundColor: '#FFFDF9',
  },
  profitLabel: {
    color: '#8F7B69',
    fontSize: 13,
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  profitValue: {
    color: '#2FA84F',
    fontSize: 24,
    fontWeight: 800,
  },
  profitRate: {
    color: '#2FA84F',
    fontSize: 16,
    fontWeight: 800,
  },
  performanceCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EEE0D1',
    backgroundColor: '#FFFDF9',
    gap: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performanceTitle: {
    color: '#2E2117',
    fontSize: 16,
  },
  performanceLink: {
    color: '#D28D1D',
    fontSize: 14,
    fontWeight: 700,
  },
  performanceList: {
    gap: 4,
  },
  performanceRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  performanceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1E6DA',
  },
  performanceNameWrap: {
    flex: 1.3,
  },
  performanceName: {
    color: '#2E2117',
    fontSize: 13,
  },
  performanceBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  performanceBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#EEE5DA',
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  performancePercent: {
    width: 34,
    color: '#6F5B47',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'right',
  },
  performanceAmount: {
    flex: 0.8,
    color: '#2E2117',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'right',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 12,
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
