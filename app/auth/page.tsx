import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function AuthPage({ searchParams }: PageProps<"/auth">) {
  return (
    <div className="av-auth-wrap fade-in">
      {/* searchParams is request-time data under Cache Components, so the form waits for it inside Suspense. */}
      <Suspense
        fallback={
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <span className="spinner" aria-label="Cargando" />
          </div>
        }
      >
        <AuthFormForMode searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AuthFormForMode({ searchParams }: Pick<PageProps<"/auth">, "searchParams">) {
  const { modo } = await searchParams;
  const requested = Array.isArray(modo) ? modo[0] : modo;
  return <AuthForm initialTab={requested === "crear" ? "up" : "in"} />;
}
