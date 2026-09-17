import { useEffect, useRef, useState } from "react";

export function useChartInteraction<T extends HTMLElement>() {
  const rootRef = useRef<T>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      const target = event.target;
      if (!(target instanceof Element) || !root) return;
      const item = target.closest("[data-chart-item]");
      if (!root.contains(target) || !item || !root.contains(item)) {
        setSelectedIndex(null);
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setSelectedIndex(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex]);

  function selectIndex(index: number) {
    setSelectedIndex(index);
  }

  return { rootRef, selectedIndex, setSelectedIndex, selectIndex };
}
