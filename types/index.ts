import type { Component } from "vue";

export type ColumnKeyType<TItem extends object> = Extract<
  keyof TItem,
  string | number
>;

export interface ColumnBaseProps<TItem extends object> {
  key: ColumnKeyType<TItem>;
  class?: string;
  headerClass?: string;
}

export type ColumnDefinition<TItem extends object> =
  | (ColumnBaseProps<TItem> & {
      columnHeaderText: string;
      renderer?: undefined;
    })
  | (ColumnBaseProps<TItem> & {
      columnHeaderText: string;
      renderer: Component<{ item: TItem; column: ColumnDefinition<TItem> }>;
    });