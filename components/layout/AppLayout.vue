<template>
  <div class="flex h-screen bg-gray-50">
    <LayoutAppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <LayoutAppHeader>
        <template #title>
          <slot name="title" />
        </template>
      </LayoutAppHeader>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
