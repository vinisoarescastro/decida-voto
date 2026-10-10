import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel administrativo",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return <div className="pb-seguro mx-auto w-full max-w-5xl px-5 pb-12 pt-6 sm:px-6 sm:pt-10">{children}</div>;
}
