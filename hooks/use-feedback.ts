"use client";

import { useState } from "react";
import { saveFeedback } from "@/lib/storage/supabase";

export function useFeedback() {
  const [feedbackMessage, setFeedbackMessage] = useState("");
  async function submit(feedback: Parameters<typeof saveFeedback>[0]) {
    const result = await saveFeedback(feedback);
    setFeedbackMessage(result.message);
    return result;
  }
  return { feedbackMessage, setFeedbackMessage, submit };
}
