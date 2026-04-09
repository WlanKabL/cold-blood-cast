import {
    ref,
    computed,
    watch,
    reactive,
    toRef,
    toRefs,
    readonly,
    onMounted,
    onUnmounted,
} from "vue";

globalThis.ref = ref;
globalThis.computed = computed;
globalThis.watch = watch;
globalThis.reactive = reactive;
globalThis.toRef = toRef;
globalThis.toRefs = toRefs;
globalThis.readonly = readonly;
globalThis.onMounted = onMounted;
globalThis.onUnmounted = onUnmounted;
