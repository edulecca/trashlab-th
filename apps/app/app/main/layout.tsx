import { BackofficeLayout } from "@/components/backoffice-layout";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BackofficeLayout>{children}</BackofficeLayout>;
}
