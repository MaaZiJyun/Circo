"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, Select } from "@/shared/components/ui";
import { useI18n } from "@/shared/i18n/i18n-context";
import type { Cycle } from "@/shared/model/entities";
import { addDays, today } from "@/shared/model/factories";
import type { CycleInput } from "../view-models/use-me-view-model";

export function CycleDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: CycleInput) => void;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState<CycleInput>({
    name: "",
    startDate: today(),
    endDate: addDays(new Date(), 30),
    cadence: "month",
  });
  const submit = () => {
    if (!input.name.trim()) return;
    onSave(input);
    onClose();
    setInput({ ...input, name: "" });
  };
  const cadences: Cycle["cadence"][] = ["day", "week", "month", "year"];
  return (
    <Dialog
      open={open}
      title={t("me.newCycle")}
      closeLabel={t("common.close")}
      onClose={onClose}
    >
      <div className="grid gap-4">
        <Field label={t("me.cycleName")}>
          <Input
            value={input.name}
            onChange={(event) =>
              setInput({ ...input, name: event.target.value })
            }
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("hand.startDate")}>
            <Input
              type="date"
              value={input.startDate}
              onChange={(event) =>
                setInput({ ...input, startDate: event.target.value })
              }
            />
          </Field>
          <Field label={t("hand.endDate")}>
            <Input
              type="date"
              value={input.endDate}
              onChange={(event) =>
                setInput({ ...input, endDate: event.target.value })
              }
            />
          </Field>
        </div>
        <Field label={t("me.cadence")}>
          <Select
            value={input.cadence}
            onChange={(event) =>
              setInput({
                ...input,
                cadence: event.target.value as Cycle["cadence"],
              })
            }
          >
            {cadences.map((item) => (
              <option key={item} value={item}>
                {t(`me.${item}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={submit}>{t("common.save")}</Button>
      </div>
    </Dialog>
  );
}
