import { ManagerSectionScreen } from '@/components/manager-section-screen';

export default function ProductsScreen() {
  return (
    <ManagerSectionScreen
      title="Urunler"
      subtitle="Firebase baglantisi hazir. Urun yonetimi bu sekmeden ilerleyecek."
      badgeLabel="Stok"
      cardTitle="Urun Listesi"
      cardDescription="Eklenen urunler, stok miktarlari ve kategori bilgileri burada listelenecek."
      detailsTitle="Sonraki Adim"
      detailsDescription="Bu ekrana urun ekleme formu ve Firestore'dan gelen canli liste baglanabilir."
    />
  );
}
