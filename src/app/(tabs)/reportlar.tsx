import { ManagerSectionScreen } from '@/components/manager-section-screen';

export default function ReportsScreen() {
  return (
    <ManagerSectionScreen
      title="Raporlar"
      subtitle="Satis, stok ve sayim raporlari bu ekranda toplanacak."
      badgeLabel="Rapor"
      cardTitle="Raporlama Merkezi"
      cardDescription="Subelerden gelen urun hareketleri, sayim verileri ve yonetim raporlari bu alanda gorunecek."
      detailsTitle="Hazirlik Durumu"
      detailsDescription="Bu sekme navigasyon yapisi icin hazirlandi. Bir sonraki adimda grafikler, filtreler ve tarih bazli raporlar eklenebilir."
    />
  );
}
