import { toast } from "vue-sonner";
import type {
  CategoriesResponse,
  Category,
  CategoryResponse,
  CreateCategory,
  UpdateCategory,
} from "~/types/category";

const sortCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => a.name.localeCompare(b.name, "es"));

export const useCategoryStore = defineStore("categoryStore", () => {
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const activeCategories = computed(() =>
    categories.value.filter((category) => category.archived_at === null),
  );

  const clearCategories = () => {
    categories.value = [];
    loading.value = false;
  };

  const fetchCategories = async () => {
    loading.value = true;

    try {
      const { data, error } = await useFetch<CategoriesResponse>("/api/categories", {
        key: "categories",
      });

      if (error.value) throw error.value;

      categories.value = sortCategories(data.value || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("No se pudieron cargar las categorías");
    } finally {
      loading.value = false;
    }
  };

  const createCategory = async (input: CreateCategory) => {
    const previousCategories = categories.value;
    const optimisticCategory: Category = {
      id: -Date.now(),
      name: input.name,
      description: input.description || null,
      archived_at: null,
    };

    categories.value = sortCategories([...previousCategories, optimisticCategory]);

    try {
      const response = await $fetch<CategoryResponse>("/api/categories", {
        method: "POST",
        body: input,
      });

      categories.value = sortCategories(
        categories.value.map((category) =>
          category.id === optimisticCategory.id ? response.data : category,
        ),
      );

      return response.data;
    } catch (error) {
      categories.value = previousCategories;
      toast.error("No se pudo crear la categoría");
      throw error;
    }
  };

  const updateCategory = async (input: UpdateCategory) => {
    const category = categories.value.find(({ id }) => id === input.id);
    if (!category) throw new Error("Category not found");

    const previousCategories = categories.value;
    const optimisticCategory: Category = {
      ...category,
      name: input.name ?? category.name,
      description:
        input.description === undefined ? category.description : input.description || null,
      archived_at:
        input.archived === undefined
          ? category.archived_at
          : input.archived
            ? new Date().toISOString()
            : null,
    };

    categories.value = sortCategories(
      categories.value.map((item) =>
        item.id === input.id ? optimisticCategory : item,
      ),
    );

    try {
      const response = await $fetch<CategoryResponse>("/api/categories", {
        method: "PUT",
        body: input,
      });

      categories.value = sortCategories(
        categories.value.map((item) =>
          item.id === input.id ? response.data : item,
        ),
      );

      return response.data;
    } catch (error) {
      categories.value = previousCategories;
      toast.error("No se pudo actualizar la categoría");
      throw error;
    }
  };

  return {
    categories,
    activeCategories,
    loading,
    clearCategories,
    fetchCategories,
    createCategory,
    updateCategory,
  };
});
