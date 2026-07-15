import { useCallback, useEffect, useMemo, useState } from 'react';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { createProduct, deleteProduct, listProducts, Product, updateProduct } from '@/lib/products';

const CATEGORY_OPTIONS = ['Kuruyemiş', 'Çekirdek', 'Baharat', 'Diğer'] as const;
const UNIT_OPTIONS = ['Kg', 'Adet', 'Paket'] as const;
const ALL_CATEGORIES = 'Tümü';

type ProductFormState = {
  name: string;
  unit: string;
  purchasePrice: string;
  salePrice: string;
  stockKg: string;
  category: string;
};

const initialFormState = (): ProductFormState => ({
  name: '',
  unit: 'Kg',
  purchasePrice: '',
  salePrice: '',
  stockKg: '',
  category: 'Kuruyemiş',
});

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [screenError, setScreenError] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const [form, setForm] = useState<ProductFormState>(initialFormState);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await listProducts();
      setProducts(items);
      setScreenError('');
    } catch (loadError) {
      setScreenError(
        loadError instanceof Error ? loadError.message : 'Ürünler alınırken bir hata oluştu.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const dynamicCategories = products
      .map((product) => product.category?.trim())
      .filter((category): category is string => Boolean(category));

    return [ALL_CATEGORIES, ...new Set([...CATEGORY_OPTIONS, ...dynamicCategories])];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase('tr-TR');

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || product.category === selectedCategory;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLocaleLowerCase('tr-TR').includes(normalizedSearch) ||
        product.category.toLocaleLowerCase('tr-TR').includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const resetForm = () => {
    setForm(initialFormState());
    setError('');
  };

  const closeCreateModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsCreateModalVisible(false);
    setEditingProduct(null);
    resetForm();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    resetForm();
    setIsCreateModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      unit: product.unit,
      purchasePrice: String(product.purchasePrice).replace('.', ','),
      salePrice: String(product.salePrice).replace('.', ','),
      stockKg: String(product.stockKg).replace('.', ','),
      category: product.category,
    });
    setError('');
    setIsCreateModalVisible(true);
  };

  const updateForm = (field: keyof ProductFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));

    if (error) {
      setError('');
    }
  };

  const handleSubmitProduct = async () => {
    if (!form.name.trim()) {
      setError('Ürün adı zorunludur.');
      return;
    }

    const purchasePrice = Number(form.purchasePrice.replace(',', '.'));
    const salePrice = Number(form.salePrice.replace(',', '.'));
    const stockKg = Number(form.stockKg.replace(',', '.'));

    if ([purchasePrice, salePrice, stockKg].some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Fiyat ve stok alanlarına geçerli sayılar girin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        name: form.name,
        unit: form.unit,
        purchasePrice,
        salePrice,
        stockKg,
        category: form.category,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      await loadProducts();
      setIsCreateModalVisible(false);
      setEditingProduct(null);
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ürün kaydedilemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Ürünü sil',
      `"${product.name}" ürününü silmek istediğine emin misin?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              await loadProducts();
            } catch (deleteError) {
              Alert.alert(
                'Silme başarısız',
                deleteError instanceof Error ? deleteError.message : 'Ürün silinemedi.',
              );
            }
          },
        },
      ],
    );
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
                Ürünler
              </ThemedText>
              <Pressable
                accessibilityLabel="Bildirimler"
                style={({ pressed }) => [styles.topBarIconButton, pressed && styles.pressedButton]}>
                <SymbolView
                  name={{ ios: 'bell', android: 'notifications_none', web: 'notifications' }}
                  size={18}
                  tintColor="#FFF7EE"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.toolbarRow}>
            <ScrollView
              contentContainerStyle={styles.categoryRow}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(category)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                      pressed && styles.pressedButton,
                    ]}>
                    <ThemedText
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}>
                      {category}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              accessibilityLabel="Yeni ürün ekle"
              onPress={openCreateModal}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}>
              <ThemedText style={styles.addButtonText}>+</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.searchRow}>
              <ThemedView type="backgroundElement" style={styles.searchCard}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={18}
                  tintColor="#B19981"
                />
                <TextInput
                  onChangeText={setSearchQuery}
                  placeholder="Ürün ara..."
                  placeholderTextColor="#B19981"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </ThemedView>

              <Pressable
                accessibilityLabel="Filtreleri temizle"
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory(ALL_CATEGORIES);
                }}
                style={({ pressed }) => [
                  styles.filterButton,
                  pressed && styles.pressedButton,
                ]}>
                <SymbolView
                  name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }}
                  size={20}
                  tintColor="#8B745E"
                />
              </Pressable>
            </View>

            <ThemedView type="backgroundElement" style={styles.tableCard}>
              {isLoading ? (
                <View style={styles.centerState}>
                  <ActivityIndicator color="#D9911A" />
                  <ThemedText themeColor="textSecondary">Ürünler yükleniyor...</ThemedText>
                </View>
              ) : screenError ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold" style={styles.errorText}>
                    Ürünler yüklenemedi
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    {screenError}
                  </ThemedText>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View style={styles.centerState}>
                  <ThemedText type="smallBold">Henüz ürün bulunmuyor.</ThemedText>
                  <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                    İlk ürünü eklemek için sağ üstteki artı butonunu kullanın.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.gridTable}>
                  <View style={styles.gridHeaderRow}>
                    <ThemedText
                      type="smallBold"
                      style={[styles.gridHeaderCell, styles.gridNameCell, styles.gridHeaderDivider]}>
                      Ürün
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.gridHeaderCell,
                        styles.gridUnitCell,
                        styles.gridTextCenter,
                        styles.gridHeaderDivider,
                      ]}>
                      Br.
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.gridHeaderCell,
                        styles.gridPriceCell,
                        styles.gridTextRight,
                        styles.gridHeaderDivider,
                      ]}>
                      Alış ₺
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={[
                        styles.gridHeaderCell,
                        styles.gridPriceCell,
                        styles.gridTextRight,
                        styles.gridHeaderDivider,
                      ]}>
                      Satış ₺
                    </ThemedText>
                    <ThemedText
                      type="smallBold"
                      style={[styles.gridHeaderCell, styles.gridStockCell, styles.gridTextRight]}>
                      Stok Kg
                    </ThemedText>
                  </View>

                  {filteredProducts.map((item, index) => (
                    <Pressable
                      key={item.id}
                      onPress={() => openEditModal(item)}
                      style={({ pressed }) => [
                        styles.gridRow,
                        index % 2 === 1 && styles.gridRowAlt,
                        pressed && styles.gridRowPressed,
                      ]}>
                      <View
                        style={[
                          styles.gridCell,
                          styles.gridNameCell,
                          styles.gridNameWrap,
                          styles.gridCellDivider,
                        ]}>
                        <View
                          style={[
                            styles.productAvatar,
                            styles.gridAvatar,
                            { backgroundColor: getAvatarColor(item.name) },
                          ]}>
                          <ThemedText style={styles.productAvatarText}>
                            {item.name.slice(0, 1).toLocaleUpperCase('tr-TR')}
                          </ThemedText>
                        </View>
                        <ThemedText type="smallBold" style={styles.productName} numberOfLines={2}>
                          {item.name}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.gridCell,
                          styles.gridUnitCell,
                          styles.gridCellDivider,
                        ]}>
                        <ThemedText style={[styles.gridMetaText, styles.gridTextCenter]} numberOfLines={1}>
                          {item.unit}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.gridCell,
                          styles.gridPriceCell,
                          styles.gridCellDivider,
                        ]}>
                        <ThemedText style={[styles.gridValueText, styles.gridTextRight]} numberOfLines={1}>
                          {formatTablePrice(item.purchasePrice)}
                        </ThemedText>
                      </View>

                      <View
                        style={[
                          styles.gridCell,
                          styles.gridPriceCell,
                          styles.gridCellDivider,
                        ]}>
                        <ThemedText style={[styles.gridValueText, styles.gridTextRight]} numberOfLines={1}>
                          {formatTablePrice(item.salePrice)}
                        </ThemedText>
                      </View>

                      <View style={[styles.gridCell, styles.gridStockCell]}>
                        <ThemedText style={[styles.gridValueText, styles.gridTextRight]} numberOfLines={1}>
                          {formatNumber(item.stockKg)}
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </ThemedView>
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        animationType="slide"
        onRequestClose={closeCreateModal}
        transparent
        visible={isCreateModalVisible}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardWrap}>
            <ThemedView style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText type="subtitle" style={styles.modalTitle}>
                    {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün'}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary">
                    {editingProduct
                      ? 'Ürün bilgilerini Firebase&apos;de güncelle'
                      : 'Yeni ürünü Firebase&apos;e kaydet'}
                  </ThemedText>
                </View>

                <Pressable onPress={closeCreateModal} style={styles.closeButton}>
                  <ThemedText style={styles.closeButtonText}>Kapat</ThemedText>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formFields}>
                  <FormField
                    label="Ürün Adı"
                    onChangeText={(value) => updateForm('name', value)}
                    placeholder="Örn. Siyah Çekirdek"
                    value={form.name}
                  />

                  <View>
                    <ThemedText type="smallBold" style={styles.fieldLabel}>
                      Kategori
                    </ThemedText>
                    <View style={styles.optionWrap}>
                      {CATEGORY_OPTIONS.map((category) => {
                        const isSelected = form.category === category;

                        return (
                          <SelectionChip
                            key={category}
                            isSelected={isSelected}
                            label={category}
                            onPress={() => updateForm('category', category)}
                          />
                        );
                      })}
                    </View>
                  </View>

                  <View>
                    <ThemedText type="smallBold" style={styles.fieldLabel}>
                      Birim
                    </ThemedText>
                    <View style={styles.optionWrap}>
                      {UNIT_OPTIONS.map((unit) => {
                        const isSelected = form.unit === unit;

                        return (
                          <SelectionChip
                            key={unit}
                            isSelected={isSelected}
                            label={unit}
                            onPress={() => updateForm('unit', unit)}
                          />
                        );
                      })}
                    </View>
                  </View>

                  <FormField
                    keyboardType="numeric"
                    label="Alış Fiyatı"
                    onChangeText={(value) => updateForm('purchasePrice', value)}
                    placeholder="0,00"
                    value={form.purchasePrice}
                  />

                  <FormField
                    keyboardType="numeric"
                    label="Satış Fiyatı"
                    onChangeText={(value) => updateForm('salePrice', value)}
                    placeholder="0,00"
                    value={form.salePrice}
                  />

                  <FormField
                    keyboardType="numeric"
                    label="Stok"
                    onChangeText={(value) => updateForm('stockKg', value)}
                    placeholder="0"
                    value={form.stockKg}
                  />

                  {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
                </View>
              </ScrollView>

              <Pressable
                disabled={isSubmitting}
                onPress={handleSubmitProduct}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || isSubmitting) && styles.pressedButton,
                ]}>
                <ThemedText style={styles.primaryButtonText}>
                  {isSubmitting
                    ? 'Kaydediliyor...'
                    : editingProduct
                      ? 'Değişiklikleri Kaydet'
                      : 'Ürünü Kaydet'}
                </ThemedText>
              </Pressable>

              {editingProduct ? (
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => {
                    closeCreateModal();
                    handleDeleteProduct(editingProduct);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryDangerButton,
                    (pressed || isSubmitting) && styles.pressedButton,
                  ]}>
                  <ThemedText style={styles.secondaryDangerButtonText}>Ürünü Sil</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View>
      <ThemedText type="smallBold" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A78F79"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SelectionChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.selectionChip,
        isSelected && styles.selectionChipSelected,
        pressed && styles.pressedButton,
      ]}>
      <ThemedText
        style={[styles.selectionChipText, isSelected && styles.selectionChipTextSelected]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

function formatTablePrice(value: number) {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value: number) {
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
  scrollContent: {
    paddingBottom: Spacing.five,
    gap: Spacing.two,
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  topBarTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: '#FFF7EE',
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
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D9911A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 26,
  },
  categoryRow: {
    gap: 10,
    paddingRight: Spacing.two,
  },
  categoryChip: {
    minHeight: 40,
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#F1E2D3',
  },
  categoryChipSelected: {
    backgroundColor: '#D9911A',
    borderColor: '#D9911A',
  },
  categoryChipText: {
    color: '#604934',
    fontSize: 14,
    fontWeight: 700,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
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
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1E3D4',
    backgroundColor: '#FFFCF9',
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
  gridTable: {
    width: '100%',
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
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#7C644C',
  },
  gridHeaderDivider: {
    borderRightWidth: 1,
    borderRightColor: '#EEDFD0',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EADF',
    backgroundColor: '#FFFFFF',
  },
  gridRowAlt: {
    backgroundColor: '#FFFCF8',
  },
  gridRowPressed: {
    backgroundColor: '#F8EFE4',
  },
  gridCell: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  gridCellDivider: {
    borderRightWidth: 1,
    borderRightColor: '#F1E5D9',
  },
  gridNameCell: {
    flex: 2.8,
  },
  gridUnitCell: {
    flex: 0.8,
    alignItems: 'center',
  },
  gridPriceCell: {
    flex: 1.35,
    alignItems: 'flex-end',
  },
  gridStockCell: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  productAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  gridAvatar: {
    marginRight: 6,
  },
  productAvatarText: {
    color: '#FFFFFF',
    fontWeight: 800,
    fontSize: 12,
  },
  productName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#2E2117',
  },
  gridMetaText: {
    fontSize: 12,
    color: '#6F5842',
  },
  gridNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridTextCenter: {
    textAlign: 'center',
  },
  gridTextRight: {
    textAlign: 'right',
  },
  gridValueText: {
    color: '#2E2117',
    fontSize: 11,
    fontWeight: 700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    justifyContent: 'flex-end',
  },
  modalKeyboardWrap: {
    width: '100%',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Platform.select({ ios: 36, android: 28, default: 28 }),
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeButtonText: {
    color: '#7B6049',
    fontWeight: 700,
  },
  formFields: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  fieldLabel: {
    marginBottom: 8,
    color: '#5D4737',
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6D6C5',
    backgroundColor: '#FCF8F3',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#2E2117',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  selectionChip: {
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5EFE7',
    borderWidth: 1,
    borderColor: '#E7D8C9',
  },
  selectionChipSelected: {
    backgroundColor: '#342116',
    borderColor: '#342116',
  },
  selectionChipText: {
    color: '#5F4733',
    fontSize: 13,
    fontWeight: 700,
  },
  selectionChipTextSelected: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#C83D3D',
    fontWeight: 700,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#D9911A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 800,
  },
  secondaryDangerButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0C9C9',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  secondaryDangerButtonText: {
    color: '#C23B3B',
    fontSize: 15,
    fontWeight: 800,
  },
  pressedButton: {
    opacity: 0.82,
  },
});
