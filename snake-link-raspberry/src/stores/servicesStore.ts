/**
 * A simple registry for service instances.
 * Allows registering, retrieving, checking, and unregistering services by key.
 */
export class ServicesStore {
    private services = new Map<string, unknown>();

    /**
     * Registers a service instance under the given key.
     * @param key       Unique identifier for the service
     * @param instance  The service instance to store
     * @throws          If a service with the same key is already registered
     */
    register<T>(key: string, instance: T): void {
        if (this.services.has(key)) {
            throw new Error(`Service with key "${key}" is already registered.`);
        }
        this.services.set(key, instance);
    }

    /**
     * Retrieves a registered service instance by key.
     * @param key  Unique identifier of the service
     * @returns    The service instance
     * @throws     If no service is registered under the key
     */
    get<T>(key: string): T {
        if (!this.services.has(key)) {
            throw new Error(`No service registered under key "${key}".`);
        }
        return this.services.get(key) as T;
    }

    /**
     * Checks if a service is registered under the given key.
     * @param key  Unique identifier of the service
     * @returns    True if the service exists, false otherwise
     */
    has(key: string): boolean {
        return this.services.has(key);
    }

    /**
     * Unregisters (removes) a service under the given key.
     * @param key  Unique identifier of the service
     */
    unregister(key: string): void {
        this.services.delete(key);
    }
}

/**
 * Singleton instance of ServicesStore to hold all service instances.
 */
export const servicesStore = new ServicesStore();
