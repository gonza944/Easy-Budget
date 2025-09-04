<script lang="ts" setup>

const sharedActivitiesStore = useMySharedActivitiesStore();
const { setSelectedSharedActivity, fetchSharedActivities } = sharedActivitiesStore;
const { sharedActivities } = storeToRefs(sharedActivitiesStore);

callOnce(async () => {
  fetchSharedActivities();
}, { mode: 'navigation' });


</script>

<template>
  <div class="flex flex-col">
    <Card>
      <CardHeader>
        <CardTitle>Shared Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-for="activity in sharedActivities" :key="activity.id">
          <h3>{{ activity.name }}</h3>
          <Button @click="setSelectedSharedActivity(activity)">View Activity</Button>
        </div>
      </CardContent>
    </Card>

  </div>
</template>