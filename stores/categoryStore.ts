import type { CategoriesResponse, Category } from "~/types/category";

export const useCategoryStore = defineStore("categoryStore", () => {
  const categories = ref<Category[]>([]);

  async function fetchCategories() {
    const { data: fetchedCategories } =
      await useFetch<CategoriesResponse>(() => `/api/categories`, {
        key: `categories`,
      });

    categories.value = fetchedCategories.value || [];
  }

  return {
    categories,
    fetchCategories,
  };
});