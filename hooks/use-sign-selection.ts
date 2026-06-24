"use client";

import { useMemo, useState } from "react";
import { signs } from "@/lib/signs";

export function useSignSelection() {
  const [selectedLabel, setSelectedLabel] = useState(signs[0]?.label ?? "");
  const [customSigns, setCustomSigns] = useState<typeof signs>([]);
  const availableSigns = useMemo(() => [...signs, ...customSigns], [customSigns]);
  const practiceSigns = useMemo(
    () => availableSigns.filter((sign) => sign.type === "alphabet" || sign.type === "number"),
    [availableSigns],
  );
  const selectedSign = availableSigns.find((sign) => sign.label === selectedLabel) ?? availableSigns[0];
  const isDynamicSign = selectedSign?.modality === "dynamic";

  return {
    selectedLabel,
    setSelectedLabel,
    setCustomSigns,
    availableSigns,
    practiceSigns,
    selectedSign,
    isDynamicSign,
  };
}
