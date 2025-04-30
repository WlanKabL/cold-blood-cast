/**
 * @file Subscriber management via DataStorageService
 */

import { DataStorageService } from "../storage/dataStorageService.js";

const store = new DataStorageService("./data");
const regKeysStore = store.getTelegramRegistrationKeysStore(); // your pre-assigned codes
const subscriberStore = store.getSubscriberStore(); // speichert chatIds

export class SubscriberService {
    /**
     * Versucht, den user mit chatId zu registrieren.
     * @param chatId – Telegram-Chat-ID des Nutzers
     * @param code   – vom Nutzer eingegebenes Secret
     * @returns true, wenn erfolgreich registriert
     */
    subscribe(chatId: number, code: string): boolean {
        const validKeys = regKeysStore.load();
        if (!validKeys.includes(code)) return false;

        const subs = subscriberStore.load();
        if (subs.includes(chatId)) return false;

        subs.push(chatId);
        subscriberStore.save(subs);
        return true;
    }

    /**
     * Hebt die Subscription auf.
     * @param chatId – Telegram-Chat-ID
     * @returns true, wenn vorher registriert
     */
    unsubscribe(chatId: number): boolean {
        const subs = subscriberStore.load();
        const filtered = subs.filter((id) => id !== chatId);
        if (filtered.length === subs.length) return false;
        subscriberStore.save(filtered);
        return true;
    }

    /**
     * Gibt alle registrierten Chat-IDs zurück.
     */
    getSubscribers(): number[] {
        return subscriberStore.load();
    }
}

// Singleton-Export
export const subscriberService = new SubscriberService();
