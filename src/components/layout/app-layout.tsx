import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="bg-background text-on-surface font-body-md h-screen w-screen overflow-hidden flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main content pane */}
      <div className="flex-1 flex flex-col ml-0 md:ml-[260px] h-screen relative overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Scrollable Canvas area */}
        <main className="flex-1 overflow-y-auto canvas-bg p-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
