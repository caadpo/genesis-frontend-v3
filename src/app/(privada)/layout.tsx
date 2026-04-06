import "../globals.css";
import "./layout.css";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="private-layout">
      <Header />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}