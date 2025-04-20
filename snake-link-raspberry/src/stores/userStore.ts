import { User } from "../types/users.js";
import { DataStorageService } from "../storage/dataStorageService.js";

const store = new DataStorageService().getUserStore();

export const userStore = {
    getAll(): User[] {
        return store.load([]);
    },

    saveAll(users: User[]): void {
        store.save(users);
    },

    findByUsername(username: string): User | undefined {
        return this.getAll().find((u) => u.username === username);
    },

    findById(id: string): User | undefined {
        return this.getAll().find((u) => u.id === id);
    },

    add(user: User): void {
        const users = this.getAll();
        users.push(user);
        this.saveAll(users);
    },
};
