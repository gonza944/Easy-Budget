import type { CategoriesResponse, Category } from "~/types/category";

export const useCategoryStore = defineStore("categoryStore", () => {
  const categories = ref<Category[]>([]);

  const clearCategories = () => {
    categories.value = [];
  };

  async function fetchCategories() {
    const { data: fetchedCategories, pending } = useLazyFetch<CategoriesResponse>(
      () => `/api/categories`, 
      { key: `categories` }
    );

    // Watch for data changes and update categories
    watch(fetchedCategories, (newData) => {
      if (newData) {
        categories.value = newData;
      }
    }, { immediate: true });

    return { pending };
  }

  return {
    categories,
    fetchCategories,
    clearCategories,
  };
});