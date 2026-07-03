"use client";

import { useEffect, useState } from "react";

/**
 * Easter egg: trash/recycling-themed one-liners that rotate while the invoice is
 * being scanned — a nod to "trashlab". Purely cosmetic.
 */
const TRASH_PHRASES = [
  "Sorting your trash by fiber content…",
  "Every recyclable gets a second life.",
  "Next time, don't mix paper with organics.",
  "Separating the paper from the plastic…",
  "Composting the metadata…",
  "Reduce, reuse, reconcile.",
  "Your invoice is 100% post-consumer.",
  "Rinsing before recycling…",
  "Diverting bytes from the landfill…",
  "One vendor's trash is another's tax deduction.",
  "Flattening the cardboard…",
  "Turning receipts into resources…",
  "Please break down large boxes.",
  "Checking the recycling number on the bottom…",
  "Even shredded, paper still counts.",
  "Bagging the biodegradable line items…",
  "Landfill diversion rate: 99.9%.",
  "Sorting glass, plastic, and PDFs…",
  "This bill will be recycled responsibly.",
  "Thanks for keeping your streams clean.",
];

export function ScanMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Start somewhere random so each scan feels fresh, then rotate.
    setIndex(Math.floor(Math.random() * TRASH_PHRASES.length));
    const id = setInterval(
      () => setIndex((i) => (i + 1) % TRASH_PHRASES.length),
      2400
    );
    return () => clearInterval(id);
  }, []);

  return (
    <span
      key={index}
      className="animate-in fade-in mt-1 max-w-xs text-balance text-center text-lg font-medium text-muted-foreground/70"
    >
      {TRASH_PHRASES[index]}
    </span>
  );
}
