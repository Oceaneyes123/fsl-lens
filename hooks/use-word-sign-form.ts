"use client";

import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { createWordSign, type Sign } from "@/lib/signs";

export function useWordSignForm({
  availableSigns,
  setCustomSigns,
  setSelectedLabel,
}: {
  availableSigns: Sign[];
  setCustomSigns: Dispatch<SetStateAction<Sign[]>>;
  setSelectedLabel: (label: string) => void;
}) {
  const [wordInput, setWordInput] = useState("");
  const [wordMessage, setWordMessage] = useState("");

  function handleAddWordSign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = wordInput.trim();
    if (!value) {
      setWordMessage("Enter a word before adding it.");
      return;
    }

    const nextSign = createWordSign(value);
    if (nextSign.label === "word_") {
      setWordMessage("Use at least one letter or number for the word sign.");
      return;
    }

    if (!availableSigns.some((sign) => sign.label === nextSign.label)) {
      setCustomSigns((currentSigns) => [...currentSigns, nextSign]);
    }

    setSelectedLabel(nextSign.label);
    setWordInput("");
    setWordMessage(`${nextSign.displayName} added to the training list.`);
  }

  return { wordInput, setWordInput, wordMessage, handleAddWordSign };
}
