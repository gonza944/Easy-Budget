<script lang="ts" setup>
import type { useForm } from 'vee-validate';
import { vAutoAnimate } from '@formkit/auto-animate/vue';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Combobox, 
  ComboboxAnchor, 
  ComboboxEmpty, 
  ComboboxGroup, 
  ComboboxInput, 
  ComboboxItem, 
  ComboboxList 
} from '../ui/combobox';
import { 
  TagsInput, 
  TagsInputInput, 
  TagsInputItem, 
  TagsInputItemDelete, 
  TagsInputItemText 
} from '../ui/tags-input';
import type { Member } from '~/types/sharedExpenses';


const { form, onSubmit } = defineProps<{
    form: ReturnType<typeof useForm>;
    onSubmit: () => void;
    isFormValid: boolean;
}>();

// Reactive data for combobox
const open = ref(false);
const searchTerm = ref('');

// Hardcoded participants for now (will be replaced with members store data later)
const availableParticipants: Ref<Member[]> = ref([
  { 
    id: 1, 
    display_name: 'John Doe', 
    email: 'john@example.com',
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 2, 
    display_name: 'Jane Smith', 
    email: 'jane@example.com',
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 3, 
    display_name: 'Bob Johnson', 
    email: 'bob@example.com',
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 4, 
    display_name: 'Alice Brown', 
    email: 'alice@example.com',
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 5, 
    display_name: 'Charlie Wilson', 
    email: 'charlie@example.com',
    user_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]);

// Filter participants based on search term and exclude already selected ones
// Note: We work with full Member objects (not just strings) to match the Zod schema
const filteredParticipants = computed(() => {
  // Get currently selected participants (array of Member objects)
  const selectedParticipants = form.values.participants || [];
  
  // Extract IDs from selected participants to avoid duplicates
  const selectedParticipantIds = selectedParticipants.map((p: Member) => p.id);
  
  // Filter out already selected participants by comparing IDs
  let filtered = availableParticipants.value.filter(participant =>
    !selectedParticipantIds.includes(participant.id)
  );
  
  // Apply search filter if user is typing
  if (searchTerm.value) {
    filtered = filtered.filter(participant =>
      participant.display_name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
  }
  
  return filtered;
});

</script>

<template>
    <form class="flex flex-col gap-4" :disabled="!isFormValid" @submit="form.handleSubmit(onSubmit)">
        <FormField v-slot="{ componentField }" name="name">
            <FormItem v-auto-animate>
                <FormLabel>Name</FormLabel>
                <FormControl>
                    <Input v-bind="componentField" placeholder="Activity name" />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <FormField v-slot="{ componentField }" name="description">
            <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                    <Textarea 
                        v-bind="componentField" 
                        placeholder="Description (optional)" 
                        class="resize-none"
                        rows="2" 
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
        </FormField>
        <!-- Participants field: Stores array of Member objects (not strings) -->
        <FormField v-slot="{ componentField }" name="participants">
            <FormItem v-auto-animate>
                <FormLabel>Participants</FormLabel>
                <FormControl>
                    <!-- 
                        Combobox handles the dropdown selection of participants
                        - model-value: Array of selected Member objects
                        - ignore-filter: We handle filtering manually in filteredParticipants
                    -->
                    <Combobox 
                        v-model:open="open"
                        :model-value="componentField.modelValue || []" 
                        :ignore-filter="true"
                        @update:model-value="componentField.onChange"
                    >
                        <ComboboxAnchor as-child>
                            <!-- 
                                TagsInput displays selected participants as removable tags
                                - Each tag represents a full Member object
                                - We display the display_name but store the complete object
                            -->
                            <TagsInput 
                                :model-value="componentField.modelValue || []" 
                                class="px-2 gap-2 w-full"
                                @update:model-value="componentField.onChange"
                            >
                                <div class="flex gap-2 flex-wrap items-center">
                                    <!-- Each selected participant as a removable tag -->
                                    <TagsInputItem 
                                        v-for="participant in (componentField.modelValue || [])" 
                                        :key="participant.id" 
                                        :value="participant"
                                        class="px-3 py-4"
                                    >
                                        <!-- Display the participant's name (but value is full Member object) -->
                                        <TagsInputItemText>{{ participant.display_name }}</TagsInputItemText>
                                        <TagsInputItemDelete />
                                    </TagsInputItem>
                                </div>

                                <!-- Search input for filtering available participants -->
                                <ComboboxInput v-model="searchTerm" as-child no-border>
                                    <TagsInputInput 
                                        placeholder="Add participants..." 
                                        class="min-w-[200px] w-full p-0 border-none h-auto" 
                                        @keydown.enter.prevent 
                                    />
                                </ComboboxInput>
                            </TagsInput>
                        </ComboboxAnchor>

                        <!-- Dropdown list of available participants -->
                        <ComboboxList class="w-[--reka-popper-anchor-width]">
                            <ComboboxEmpty class="p-4">No participants found. You can add them manually after creating the activity.</ComboboxEmpty>
                            <ComboboxGroup>
                                <!-- 
                                    Each selectable participant item
                                    - value: Full Member object (required for Zod validation)
                                    - We pass the entire Member object to the form, not just the name
                                -->
                                <ComboboxItem
                                    v-for="participant in filteredParticipants" 
                                    :key="participant.id" 
                                    :value="participant"
                                    class="px-4"
                                    @select.prevent="(ev) => {
                                        // Cast the selected value to Member type for type safety
                                        const selectedParticipant = ev.detail.value as Member;
                                        
                                        if (selectedParticipant && selectedParticipant.id) {
                                            // Clear search term after selection
                                            searchTerm = '';
                                            
                                            // Get current selected participants (array of Member objects)
                                            const currentValue = componentField.modelValue || [];
                                            
                                            // Check if participant is already selected (compare by ID)
                                            const isAlreadySelected = currentValue.some((p: Member) => p.id === selectedParticipant.id);
                                            
                                            // Add the full Member object to the form (not just the name)
                                            if (!isAlreadySelected) {
                                                componentField.onChange([...currentValue, selectedParticipant]);
                                            }
                                        }

                                        // Close dropdown if no more participants available
                                        if (filteredParticipants.length === 0) {
                                            open = false;
                                        }
                                    }"
                                >
                                    <!-- Display participant info in dropdown -->
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ participant.display_name }}</span>
                                        <span class="text-sm text-muted-foreground ">{{ participant.email }}</span>
                                    </div>
                                </ComboboxItem>
                            </ComboboxGroup>
                        </ComboboxList>
                    </Combobox>
                </FormControl>
               
                <FormMessage />
            </FormItem>
        </FormField>
    </form>
</template>