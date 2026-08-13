"use client";

import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { Button } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";

export function CitationButton({
  citation,
  onError,
}: {
  citation: string;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText(citation);
    } catch {
      onError(t("find.copyCitationFailed"));
    }
  };
  return (
    <Button
      variant="secondary"
      disabled={!citation.trim()}
      onClick={() => void copy()}
    >
      <ClipboardDocumentIcon className="size-4" />
      {t("find.cite")}
    </Button>
  );
}
