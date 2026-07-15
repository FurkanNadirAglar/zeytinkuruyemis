import { EmployeeSectionScreen } from '@/components/employee-section-screen';

export default function SayimScreen() {
  return (
    <EmployeeSectionScreen
      title="Sayim"
      subtitle="Calisan tarafindaki urun sayim ve kontrol adimlari burada yer alacak."
      badgeLabel="Sayim"
      cardTitle="Sayim Ekrani"
      cardDescription="Barkod okutma, urun sayisi girme ve raf kontrolu bu sekmeden yapilabilecek."
      detailsTitle="Siradaki Adim"
      detailsDescription="Istersen sonraki adimda bu ekrani kamera ya da manuel urun secimi ile gercek sayim akisina baglayayim."
    />
  );
}
