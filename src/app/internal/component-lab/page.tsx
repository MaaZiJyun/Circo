import type { Metadata } from "next";
import { ComponentLabView } from "@/modules/component-lab/views/component-lab-view";

export const metadata: Metadata = {
  title: "Component Lab",
  robots: { index: false, follow: false },
};

export default function ComponentLabPage() {
  return <ComponentLabView />;
}

