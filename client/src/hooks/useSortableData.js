import { useMemo, useState } from "react";

function getValue(item, key) {
  return key.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), item);
}

export function useSortableData(items, initialKey) {
  const [sortConfig, setSortConfig] = useState({
    key: initialKey,
    direction: "asc"
  });

  const sortedItems = useMemo(() => {
    const sortableItems = [...items];
    sortableItems.sort((a, b) => {
      const first = getValue(a, sortConfig.key);
      const second = getValue(b, sortConfig.key);

      if (first < second) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (first > second) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  return { sortedItems, sortConfig, requestSort };
}
