import { ref, computed, watch, reactive, toRef, toRefs } from "vue";

// Provide Vue auto-imports that Nuxt adds globally
globalThis.ref = ref;
globalThis.computed = computed;
globalThis.watch = watch;
globalThis.reactive = reactive;
globalThis.toRef = toRef;
globalThis.toRefs = toRefs;
