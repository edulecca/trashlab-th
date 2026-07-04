import { describe, it, expect, beforeEach } from "vitest";

import { useBillsView } from "../bills-view";

beforeEach(() => useBillsView.getState().resetView());

describe("bills-view store", () => {
  it("toggleColumn hides a column, but never a locked one", () => {
    const { toggleColumn } = useBillsView.getState();
    toggleColumn("number");
    expect(useBillsView.getState().columnVisibility.number).toBe(false);
    toggleColumn("vendor"); // locked — stays visible
    expect(useBillsView.getState().columnVisibility.vendor).toBe(true);
  });

  it("resetView restores default visibility + order", () => {
    const s = useBillsView.getState();
    s.toggleColumn("amount");
    s.setColumnOrder(["action", "vendor", "number", "dueDate", "status", "amount"]);
    s.resetView();
    const after = useBillsView.getState();
    expect(after.columnVisibility.amount).toBe(true);
    expect(after.columnOrder[0]).toBe("vendor");
  });
});
