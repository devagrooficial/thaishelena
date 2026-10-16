import Link from "next/link";
import { sair } from "../actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app">
      <nav className="side">
        <div className="marca">ESPAÇO THAÍS HELENA</div>
        <div className="tag">ESTRIA, CICATRIZ &amp; FLACIDEZ</div>
        <Link href="/">Dashboard</Link>
        <Link href="/clientes">Clientes</Link>
        <Link href="/clientes/nova">+ Nova cliente</Link>
        <form action={sair} className="fim">
          <button className="link">Sair</button>
        </form>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
