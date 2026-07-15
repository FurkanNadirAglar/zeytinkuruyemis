import { ManagerSectionScreen } from '@/components/manager-section-screen';

export default function BranchesScreen() {
  return (
    <ManagerSectionScreen
      title="Subeler"
      subtitle="Sube bazli operasyonlari ayri bir sekmede yonetebilirsin."
      badgeLabel="Sube"
      cardTitle="Sube Yonetimi"
      cardDescription="Her subenin urun durumu, personel akisi ve sayim kayitlari bu alandan izlenebilir."
      detailsTitle="Yapilabilecekler"
      detailsDescription="Ileride sube ekleme, sube duzenleme ve sube bazli filtreleme alanlari bu ekrana eklenebilir."
    />
  );
}
