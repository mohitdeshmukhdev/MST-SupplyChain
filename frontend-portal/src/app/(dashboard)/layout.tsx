import { Sidebar } from '../../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 pt-16">
      {/* Sidebar container */}
      <div className="hidden md:flex w-64 flex-shrink-0">
        <Sidebar />
      </div>
      {/* Main content container */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
