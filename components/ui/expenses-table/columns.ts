import { h } from "vue";
import type { ColumnDef } from "@tanstack/vue-table";
import type { Expense } from "~/types/expense";
import TableCardDropdown from "./tableCardDropdown.vue";

export const columns: ColumnDef<Expense>[] = [
  {
    accessorKey: "name",
    header: () => h("div", { class: "text-left" }, "Name"),
    cell: ({ row }) => {
      return h("div", { class: "text-left font-medium" }, row.getValue("name"));
    },
  },
  {
    accessorKey: "description",
    header: () => h("div", { class: "text-left" }, "Description"),
    cell: ({ row }) => {
      return h(
        "div",
        { class: "break-words whitespace-normal hyphens-auto" },
        row.getValue("description")
      );
    },
  },
  {
    accessorKey: "amount",
    header: () => h("div", { class: "text-right" }, "Amount"),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return h(
        "div",
        { class: "text-right text-destructive-foreground" },
        formatted
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const expense = row.original

      return h('div', { class: 'relative' }, h(TableCardDropdown, {
        expense,
      }))
    },
  }
];
