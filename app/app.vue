<script setup lang="ts">
import { api } from "../convex/_generated/api";
const { data: collections } = useConvexQuery(api.collections.getCollections);
</script>

<template>
  <div>
    <h1>Collections</h1>
    <ul>
      <li v-for="collection in collections" :key="collection._id">
        <span>{{ collection.name }}</span>
      </li>
    </ul>
  </div>
</template>
