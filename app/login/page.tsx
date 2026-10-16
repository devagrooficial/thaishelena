import { LoginForm } from "./form";

export const metadata = { title: "Entrar · Espaço Thaís Helena" };

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div className="card login">
        <div className="cab">
          <div className="marca">ESPAÇO THAÍS HELENA</div>
          <div className="tag">ESTRIA, CICATRIZ &amp; FLACIDEZ</div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
