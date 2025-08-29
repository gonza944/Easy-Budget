<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilIcon } from 'lucide-vue-next';


type Props = {
  remainingMonthlyBudget: number | null;
  monthlyBudgetLoading: boolean;
  remainingDailyBudget: number;
};

defineProps<Props>();

const { selectedDate } = useSelectedDate();
const isDateEqualOrFuture = computed(() => {
  const now = new Date();
  const selected = selectedDate.value;
  
  return selected.getFullYear() > now.getFullYear() ||
    (selected.getFullYear() === now.getFullYear() && selected.getMonth() >= now.getMonth());
});

const isEditing = ref(false);

</script>

<template>
  <Card class="w-full md:min-w-xs 2xl:min-w-md md:aspect-square items-baseline justify-end relative group">
    <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
      <Button v-if="isDateEqualOrFuture" variant="ghost" size="icon" class="h-8 w-8" @click="isEditing = !isEditing">
        <PencilIcon class="h-4 w-4" />
      </Button>
    </div>
    <CardHeader class="w-full">
      <CardTitle>Remaining Budgets</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-4 w-full">
      <div class="flex flex-row gap-2 justify-between">
        <p>Monthly Budget:</p>
        <template v-if="monthlyBudgetLoading">
          <Skeleton class="w-[30%] h-10 rounded-full" />
        </template>
        <template v-else>
          <p :class="{
            'text-destructive-foreground': (remainingMonthlyBudget || 0) < 0,
            'text-success': (remainingMonthlyBudget || 0) >= 0
          }">
            {{ Number(remainingMonthlyBudget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </p>
        </template>
      </div>

      <div class="flex flex-row gap-2 justify-between">
        <p>Daily Budget:</p>
        <template v-if="monthlyBudgetLoading">
          <Skeleton class="w-[30%] h-10 rounded-full" />
        </template>
        <template v-else>
          <p :class="{
            'text-destructive-foreground': remainingDailyBudget < 0,
            'text-success': remainingDailyBudget >= 0
          }">
            {{ remainingDailyBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </p>
        </template>
      </div>
    </CardContent>
  </Card>
  <EditBudget v-if="isEditing" v-model="isEditing" />
</template>