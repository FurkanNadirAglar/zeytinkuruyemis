import { useEffect, useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { saveBranchCount, subscribeBranchCount } from '@/lib/branch-counts';
import { Product, subscribeProducts } from '@/lib/products';

type CountInputState = {
  rawKg: string;
  roastedKg: string;
};

const EMPTY_COUNT_INPUT: CountInputState = {
  rawKg: '',
  roastedKg: '',
};

export default function SayimScreen() {
  const router = useRouter();
  const { selectedBranch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [countInputs, setCountInputs] = useState<Record<string, CountInputState>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const activeCountInputs = selectedBranch ? countInputs : {};

  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (items) => {
        setProducts(items);
        setCountInputs((current) => syncCountInputs(current, items));
        setScreenError('');
        setIsLoading(false);
      },
      (loadError) => {
        setScreenError(loadError.message || 'Urunler alinirken bir hata olustu.');
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedBranch) {
      return;
    }

    const unsubscribe = subscribeBranchCount(
      selectedBranch.id,
      (record) => {
        setCountInputs(record ? mapBranchCountToInputs(record.items) : {});
      },
      (loadError) => {
        setScreenError(loadError.message || 'Sube sayim kaydi alinirken bir hata olustu.');
      },
    );

    return unsubscribe;
  }, [selectedBranch]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR');

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      const nameMatches = product.name.toLocaleLowerCase('tr-TR').includes(normalizedSearch);
      const categoryMatches = product.category.toLocaleLowerCase('tr-TR').includes(normalizedSearch);

      return nameMatches || categoryMatches;
    });
  }, [products, searchQuery]);

  const handleCountChange = (
    productId: string,
    field: keyof CountInputState,
    value: string,
  ) => {
    if (saveMessage) {
      setSaveMessage('');
    }

    setCountInputs((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] ?? EMPTY_COUNT_INPUT),
        [field]: sanitizeNumericInput(value),
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedBranch) {
      setSaveMessage('Kayit icin once ana sayfadan sube secmelisin.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage('');

      const items = products
        .map((product) => {
          const inputState = countInputs[product.id] ?? EMPTY_COUNT_INPUT;
          const rawKg = parseFlexibleNumber(inputState.rawKg);
          const roastedKg = parseFlexibleNumber(inputState.roastedKg);
          const totalKg = rawKg + roastedKg;

          return {
            productId: product.id,
            productName: product.name,
            category: product.category,
            unit: product.unit,
            purchasePrice: product.purchasePrice,
            salePrice: product.salePrice,
            rawKg,
            roastedKg,
            totalKg,
            totalAmount: product.purchasePrice * totalKg,
          };
        })
        .filter((item) => item.totalKg > 0);

      await saveBranchCount({
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        items,
      });

      setSaveMessage(`${selectedBranch.name} subesi icin sayim kaydedildi.`);
    } catch (saveError) {
      setSaveMessage(
        saveError instanceof Error ? saveError.message : 'Sayim kaydi kaydedilemedi.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.page}>
          <View style={styles.headerBanner}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Geri"
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back' }}
                  size={18}
                  tintColor="#FFF7EE"
                />
              </Pressable>
              <ThemedText type="subtitle" style={styles.topBarTitle}>
                Sayim
              </ThemedText>
              <View style={styles.topBarBadge}>
                <ThemedText style={styles.topBarBadgeText}>Calisan</ThemedText>
              </View>
            </View>

            <View style={styles.headerInfoCard}>
              <ThemedText type="smallBold" style={styles.headerInfoTitle}>
                Urun sayim tablosu
              </ThemedText>
              <ThemedText style={styles.headerInfoText}>
                Mudur tarafinda eklenen urunler burada listelenir. Cig ve kavrulmus kilo
                girildiginde toplam tutar alis fiyatina gore otomatik hesaplanir.
              </ThemedText>
              <View style={styles.branchBadge}>
                <ThemedText style={styles.branchBadgeText}>
                  {selectedBranch ? `Sube: ${selectedBranch.name}` : 'Sube secilmedi'}
                </ThemedText>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {!selectedBranch ? (
              <ThemedView type="backgroundElement" style={styles.branchWarningCard}>
                <ThemedText type="smallBold" style={styles.branchWarningTitle}>
                  Once sube sec
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.branchWarningText}>
                  Sayim kayitlari sube bazli tutulur. Ana sayfaya gidip bir sube secmeden bu
                  ekranda kayit yapamazsin.
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/employee-home')}
                  style={({ pressed }) => [
                    styles.branchWarningButton,
                    pressed && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.branchWarningButtonText}>Ana Sayfaya Git</ThemedText>
                </Pressable>
              </ThemedView>
            ) : null}

            <View style={styles.searchRow}>
              <ThemedView type="backgroundElement" style={styles.searchCard}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={18}
                  tintColor="#B19981"
                />
                <TextInput
                  onChangeText={setSearchQuery}
                  placeholder="Urun ara..."
                  placeholderTextColor="#B19981"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </ThemedView>
            </View>

            <ThemedView type="backgroundElement" style={styles.tableCard}>
              {isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#D9911A" />
                  <ThemedText themeColor="textSecondary">Urunler yukleniyor...</ThemedText>
                </View>
              ) : screenError ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold" style={styles.errorText}>
                    Urunler yuklenemedi
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    {screenError}
                  </ThemedText>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold">Listelenecek urun bulunmuyor.</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    Mudur tarafinda urun eklendiginde burada otomatik gorunecek.
                  </ThemedText>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.gridTable}>
                    <View style={styles.gridHeaderRow}>
                      <ThemedText
                        type="smallBold"
                        style={[styles.gridHeaderCell, styles.productCell, styles.gridHeaderDivider]}>
                        Urun
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={[styles.gridHeaderCell, styles.priceCell, styles.gridHeaderDivider]}>
                        Alis
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={[styles.gridHeaderCell, styles.priceCell, styles.gridHeaderDivider]}>
                        Satis
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={[styles.gridHeaderCell, styles.inputCell, styles.gridHeaderDivider]}>
                        Cig Kg
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={[styles.gridHeaderCell, styles.inputCell, styles.gridHeaderDivider]}>
                        Kavrulmus Kg
                      </ThemedText>
                      <ThemedText type="smallBold" style={[styles.gridHeaderCell, styles.totalCell]}>
                        Toplam
                      </ThemedText>
                    </View>

                    {filteredProducts.map((item, index) => {
                      const inputState = activeCountInputs[item.id] ?? EMPTY_COUNT_INPUT;
                      const rawKg = parseFlexibleNumber(inputState.rawKg);
                      const roastedKg = parseFlexibleNumber(inputState.roastedKg);
                      const totalValue = item.purchasePrice * (rawKg + roastedKg);

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.gridRow,
                            index % 2 === 1 && styles.gridRowAlt,
                          ]}>
                          <View
                            style={[
                              styles.gridCell,
                              styles.productCell,
                              styles.productCellWrap,
                              styles.gridCellDivider,
                            ]}>
                            <View style={[styles.productAvatar, { backgroundColor: getAvatarColor(item.name) }]}>
                              <ThemedText style={styles.productAvatarText}>
                                {item.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
                              </ThemedText>
                            </View>
                            <View style={styles.productTextWrap}>
                              <ThemedText type="smallBold" style={styles.productName} numberOfLines={2}>
                                {item.name}
                              </ThemedText>
                              <ThemedText style={styles.productMeta} numberOfLines={1}>
                                {item.category}
                              </ThemedText>
                            </View>
                          </View>

                          <View style={[styles.gridCell, styles.priceCell, styles.gridCellDivider]}>
                            <ThemedText style={styles.gridValueText}>{formatCurrency(item.purchasePrice)}</ThemedText>
                          </View>

                          <View style={[styles.gridCell, styles.priceCell, styles.gridCellDivider]}>
                            <ThemedText style={styles.gridValueText}>{formatCurrency(item.salePrice)}</ThemedText>
                          </View>

                          <View style={[styles.gridCell, styles.inputCell, styles.gridCellDivider]}>
                            <TextInput
                              keyboardType="numeric"
                              onChangeText={(value) => handleCountChange(item.id, 'rawKg', value)}
                              placeholder="0"
                              placeholderTextColor="#B19981"
                              style={styles.inlineInput}
                              value={inputState.rawKg}
                            />
                          </View>

                          <View style={[styles.gridCell, styles.inputCell, styles.gridCellDivider]}>
                            <TextInput
                              keyboardType="numeric"
                              onChangeText={(value) => handleCountChange(item.id, 'roastedKg', value)}
                              placeholder="0"
                              placeholderTextColor="#B19981"
                              style={styles.inlineInput}
                              value={inputState.roastedKg}
                            />
                          </View>

                          <View style={[styles.gridCell, styles.totalCell]}>
                            <ThemedText style={styles.totalValueText}>{formatCurrency(totalValue)}</ThemedText>
                            <ThemedText style={styles.totalMetaText}>
                              {formatKg(rawKg + roastedKg)} kg
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.saveCard}>
              <View style={styles.saveInfoRow}>
                <View style={styles.saveInfoTextWrap}>
                  <ThemedText type="smallBold" style={styles.saveTitle}>
                    Sube bazli kayit
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    Bu ekrandaki girisler secili sube icin Firebase&apos;e kaydedilir.
                  </ThemedText>
                </View>
                <Pressable
                  disabled={!selectedBranch || isSaving || isLoading}
                  onPress={handleSave}
                  style={({ pressed }) => [
                    styles.saveButton,
                    (!selectedBranch || isSaving || isLoading) && styles.saveButtonDisabled,
                    pressed && selectedBranch && !isSaving && !isLoading && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.saveButtonText}>
                    {isSaving ? 'Kaydediliyor...' : 'Sayimi Kaydet'}
                  </ThemedText>
                </Pressable>
              </View>

              {saveMessage ? (
                <ThemedText
                  style={[
                    styles.saveMessage,
                    saveMessage.toLocaleLowerCase('tr-TR').includes('kaydedildi')
                      ? styles.saveMessageSuccess
                      : styles.saveMessageError,
                  ]}>
                  {saveMessage}
                </ThemedText>
              ) : null}
            </ThemedView>
          </ScrollView>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function syncCountInputs(
  current: Record<string, CountInputState>,
  products: Product[],
): Record<string, CountInputState> {
  return products.reduce<Record<string, CountInputState>>((next, product) => {
    next[product.id] = current[product.id] ?? EMPTY_COUNT_INPUT;
    return next;
  }, {});
}

function mapBranchCountToInputs(items: { productId: string; rawKg: number; roastedKg: number }[]) {
  return items.reduce<Record<string, CountInputState>>((next, item) => {
    next[item.productId] = {
      rawKg: item.rawKg > 0 ? String(item.rawKg).replace('.', ',') : '',
      roastedKg: item.roastedKg > 0 ? String(item.roastedKg).replace('.', ',') : '',
    };

    return next;
  }, {});
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d.,]/g, '');
}

function parseFlexibleNumber(value: string) {
  const trimmed = value.trim().replace(/[^\d.,]/g, '');

  if (!trimmed) {
    return 0;
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(trimmed)) {
    return Number(trimmed.replace(/[.,]/g, ''));
  }

  const lastComma = trimmed.lastIndexOf(',');
  const lastDot = trimmed.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    const integerOnly = trimmed.replace(/[^\d]/g, '');
    return integerOnly ? Number(integerOnly) : 0;
  }

  if (trimmed.indexOf(',') === decimalIndex && trimmed.indexOf('.') === -1) {
    const decimalDigits = trimmed.length - decimalIndex - 1;

    if (decimalDigits === 3) {
      return Number(trimmed.replace(',', ''));
    }
  }

  if (trimmed.indexOf('.') === decimalIndex && trimmed.indexOf(',') === -1) {
    const decimalDigits = trimmed.length - decimalIndex - 1;

    if (decimalDigits === 3) {
      return Number(trimmed.replace('.', ''));
    }
  }

  const integerPart = trimmed.slice(0, decimalIndex).replace(/[^\d]/g, '');
  const decimalPart = trimmed.slice(decimalIndex + 1).replace(/[^\d]/g, '');
  const normalized = `${integerPart || '0'}.${decimalPart}`;
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatKg(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getAvatarColor(name: string) {
  const palette = ['#7B5734', '#A96B1C', '#B8842A', '#886143', '#D19A2A'];
  const total = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return palette[total % palette.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    paddingTop: 0,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  headerBanner: {
    marginHorizontal: -Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    marginBottom: Spacing.two,
    backgroundColor: '#2F1D0E',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: Spacing.two,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    gap: Spacing.two,
  },
  topBarTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    color: '#FFF7EE',
    textAlign: 'center',
  },
  topBarIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.18)',
  },
  topBarBadge: {
    minWidth: 58,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 248, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.18)',
  },
  topBarBadgeText: {
    color: '#FFF7EE',
    fontSize: 12,
    fontWeight: 700,
  },
  headerInfoCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 248, 239, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.12)',
    gap: 4,
  },
  headerInfoTitle: {
    color: '#FFF7EE',
  },
  headerInfoText: {
    color: '#E8D5BF',
    lineHeight: 20,
  },
  branchBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 248, 239, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 239, 0.18)',
  },
  branchBadgeText: {
    color: '#FFF7EE',
    fontSize: 12,
    fontWeight: 700,
  },
  scrollContent: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  branchWarningCard: {
    gap: Spacing.two,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF8ED',
    borderWidth: 1,
    borderColor: '#F2DEC1',
  },
  branchWarningTitle: {
    color: '#7B5734',
  },
  branchWarningText: {
    lineHeight: 20,
  },
  branchWarningButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#D9911A',
  },
  branchWarningButtonText: {
    color: '#FFFFFF',
    fontWeight: 800,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#F1E3D4',
    backgroundColor: '#FFFCF9',
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    fontSize: 15,
    color: '#2E2117',
  },
  tableCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
  },
  errorText: {
    color: '#C83D3D',
    fontWeight: 700,
  },
  gridTable: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3E7DA',
    backgroundColor: '#FFFDFB',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCF3E8',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E1D0',
    minHeight: 46,
  },
  gridHeaderCell: {
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#7C644C',
  },
  gridHeaderDivider: {
    borderRightWidth: 1,
    borderRightColor: '#EEDFD0',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 76,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EADF',
    backgroundColor: '#FFFFFF',
  },
  gridRowAlt: {
    backgroundColor: '#FFFCF8',
  },
  gridCell: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  gridCellDivider: {
    borderRightWidth: 1,
    borderRightColor: '#F1E5D9',
  },
  productCell: {
    width: 210,
  },
  priceCell: {
    width: 110,
    alignItems: 'flex-end',
  },
  inputCell: {
    width: 120,
  },
  totalCell: {
    width: 140,
    alignItems: 'flex-end',
  },
  productCellWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productAvatarText: {
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: 13,
  },
  productTextWrap: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2E2117',
  },
  productMeta: {
    fontSize: 11,
    color: '#8A6F56',
  },
  gridValueText: {
    color: '#2E2117',
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'right',
  },
  inlineInput: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5D8CA',
    backgroundColor: '#FFFCF8',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#2E2117',
    textAlign: 'right',
  },
  totalValueText: {
    color: '#2E2117',
    fontSize: 12,
    fontWeight: 800,
    textAlign: 'right',
  },
  totalMetaText: {
    marginTop: 2,
    color: '#8A6F56',
    fontSize: 11,
    textAlign: 'right',
  },
  saveCard: {
    gap: Spacing.two,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EADBCB',
    backgroundColor: '#FFFDF9',
  },
  saveInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveInfoTextWrap: {
    flex: 1,
    gap: 2,
  },
  saveTitle: {
    color: '#2E2117',
  },
  saveButton: {
    minHeight: 46,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2F1D0E',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF7EE',
    fontWeight: 800,
  },
  saveMessage: {
    fontSize: 13,
    fontWeight: 700,
  },
  saveMessageSuccess: {
    color: '#2F7A32',
  },
  saveMessageError: {
    color: '#C83D3D',
  },
  pressedButton: {
    opacity: 0.82,
  },
});
