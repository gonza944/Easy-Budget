<script lang="ts" setup>
import { SearchIcon, ListFilterIcon } from 'lucide-vue-next';
import type { Budget, Expense, Category } from '~/types';

definePageMeta({
  middleware: ['authenticated'],
})

const _route = useRoute();
const router = useRouter();

// State - Fix for handling budgetId properly
const budgetId = ref(23);
const selectedBudget = ref<Budget | null>(null);
const searchTerm = ref('');
const selectedCategoryIds = ref<number[]>([]);
const selectedDateRange = ref<{ start: Date | null; end: Date | null }>({
  start: null,
  end: null,
});
const isFilterMenuOpen = ref(false);

// Fetch budget details
const { data: _ } = await useFetch<Budget>(`/api/budgets/${budgetId.value}`, {
  key: computed(() => `budget-${budgetId.value}`),
  enabled: computed(() => !!budgetId.value),
  onResponse({ response }) {
    if (response.ok && response._data) {
      selectedBudget.value = response._data;
    }
  }
});

// Fetch categories
const { data: categories } = await useFetch<Category[]>('/api/categories', {
  key: 'all-categories',
  transform: (data) => data || []
});

// Prepare query params for expenses
const expenseQueryParams = computed(() => {
  const params: Record<string, string> = {};
  
  if (budgetId.value) {
    params.budget_id = budgetId.value;
  }
  
  if (selectedCategoryIds.value.length === 1) {
    params.category_id = selectedCategoryIds.value[0].toString();
  }
  
  if (selectedDateRange.value.start) {
    params.start_date = selectedDateRange.value.start.toISOString().split('T')[0];
  }
  
  if (selectedDateRange.value.end) {
    params.end_date = selectedDateRange.value.end.toISOString().split('T')[0];
  }
  
  return params;
});

// Fetch expenses based on filters
const { data: expenses, refresh: refreshExpenses } = await useFetch<Expense[]>('/api/expenses', {
  key: computed(() => `expenses-${JSON.stringify(expenseQueryParams.value)}`),
  params: expenseQueryParams,
  transform: (data) => {
    return (data || []).filter(expense => {
      // Apply local search filter
      if (searchTerm.value && !expense.name.toLowerCase().includes(searchTerm.value.toLowerCase())) {
        return false;
      }
      
      // Apply category filter if multiple categories are selected
      if (selectedCategoryIds.value.length > 1 && !selectedCategoryIds.value.includes(expense.category_id)) {
        return false;
      }
      
      return true;
    });
  }
});

// Watch for filter changes
watch([searchTerm, selectedCategoryIds, selectedDateRange], () => {
  refreshExpenses();
}, { deep: true });

// Get expense total
const expenseTotal = computed(() => {
  return expenses.value?.reduce((total, expense) => total + expense.amount, 0) || 0;
});

// Get expenses by category for chart
const expensesByCategory = computed(() => {
  const result: Record<string, number> = {};
  
  if (!expenses.value || !categories.value) return result;
  
  expenses.value.forEach(expense => {
    const category = categories.value?.find(cat => cat.id === expense.category_id);
    const categoryName = category?.name || 'Uncategorized';
    
    if (!result[categoryName]) {
      result[categoryName] = 0;
    }
    
    result[categoryName] += expense.amount;
  });
  
  return result;
});

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Toggle category selection
const toggleCategorySelection = (categoryId: number) => {
  const index = selectedCategoryIds.value.indexOf(categoryId);
  if (index === -1) {
    selectedCategoryIds.value.push(categoryId);
  } else {
    selectedCategoryIds.value.splice(index, 1);
  }
};

// Clear all filters
const clearFilters = () => {
  searchTerm.value = '';
  selectedCategoryIds.value = [];
  selectedDateRange.value = { start: null, end: null };
  isFilterMenuOpen.value = false;
};

// Navigate back to budgets page
const navigateBack = () => {
  router.push('/myBudgets');
};
</script>

<template>
  <div class="h-full flex flex-col gap-4 p-4 md:p-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
      <div class="flex flex-col">
        <Button variant="ghost" size="sm" class="w-fit mb-2" @click="navigateBack">
          <span class="mr-2">←</span> Back to Budgets
        </Button>
        <h1 class="text-2xl md:text-3xl font-bold">
          {{ selectedBudget?.name || 'Budget Expenses' }}
        </h1>
        <p v-if="selectedBudget?.description" class="text-muted-foreground mt-1">
          {{ selectedBudget.description }}
        </p>
      </div>
      
      <div class="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
        <div class="relative">
          <Input 
            v-model="searchTerm" 
            placeholder="Search expenses..." 
            class="pr-8 w-full md:w-64"
          />
          <SearchIcon class="h-4 w-4 absolute right-3 top-2.5 text-muted-foreground" />
        </div>
        
        <Popover v-model:open="isFilterMenuOpen">
          <PopoverTrigger asChild>
            <Button variant="outline" class="gap-2">
              <ListFilterIcon class="h-4 w-4" />
              <span>Filters</span>
              <Badge v-if="selectedCategoryIds.length || (selectedDateRange.start && selectedDateRange.end)" 
                variant="secondary" class="ml-1">
                {{ selectedCategoryIds.length + (selectedDateRange.start && selectedDateRange.end ? 1 : 0) }}
              </Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80">
            <div class="space-y-4">
              <h4 class="font-medium">Filter Expenses</h4>
              
              <div class="space-y-2">
                <h5 class="text-sm font-medium">Categories</h5>
                <div class="grid grid-cols-2 gap-2">
                  <Button 
                    v-for="category in categories" 
                    :key="category.id"
                    variant="outline"
                    size="sm"
                    :class="[
                      selectedCategoryIds.includes(category.id) ? 'bg-primary text-primary-foreground' : '',
                      'justify-start'
                    ]"
                    @click="toggleCategorySelection(category.id)"
                  >
                    {{ category.name }}
                  </Button>
                </div>
              </div>
              
              <div class="space-y-2">
                <h5 class="text-sm font-medium">Date Range</h5>
                <DatePicker v-model="selectedDateRange" mode="range" />
              </div>
              
              <div class="flex justify-between pt-2">
                <Button variant="ghost" size="sm" @click="clearFilters">Clear filters</Button>
                <Button size="sm" @click="isFilterMenuOpen = false">Apply</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ formatCurrency(expenseTotal) }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            From {{ expenses?.length || 0 }} transactions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Categories Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ Object.keys(expensesByCategory).length || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            Out of {{ categories?.length || 0 }} available categories
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Average per Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(expenses?.length ? expenseTotal / expenses.length : 0) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            Per transaction average
          </p>
        </CardContent>
      </Card>
    </div>
    
    <!-- Expense Data -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Expense List -->
      <Card class="lg:col-span-2">
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle>Expenses</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="!expenses?.length" class="py-12 text-center">
            <p class="text-muted-foreground">No expenses found. Adjust your filters or add some expenses.</p>
          </div>
          
          <div v-else class="space-y-1">
            <div v-for="expense in expenses" :key="expense.id" 
              class="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
              <div class="flex-1">
                <h4 class="font-medium">{{ expense.name }}</h4>
                <div class="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{{ new Date(expense.date).toLocaleDateString() }}</span>
                  <span>•</span>
                  <span>{{ categories?.find(c => c.id === expense.category_id)?.name || 'Uncategorized' }}</span>
                </div>
              </div>
              <div class="font-medium">
                {{ formatCurrency(expense.amount) }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <!-- Category Breakdown -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="!Object.keys(expensesByCategory).length" class="py-12 text-center">
            <p class="text-muted-foreground">No category data available</p>
          </div>
          
          <div v-else class="space-y-2">
            <div v-for="(amount, category) in expensesByCategory" :key="category"
              class="flex flex-col p-2 rounded-md hover:bg-muted transition-colors">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ category }}</span>
                <span>{{ formatCurrency(amount) }}</span>
              </div>
              <div class="mt-1 h-2 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                <div class="h-full bg-primary" 
                  :style="`width: ${Math.min(100, (amount / expenseTotal) * 100)}%`"></div>
              </div>
              <div class="text-xs text-right text-muted-foreground mt-1">
                {{ Math.round((amount / expenseTotal) * 100) }}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>