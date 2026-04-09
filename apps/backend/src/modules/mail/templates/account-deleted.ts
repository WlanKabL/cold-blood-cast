/**
 * Account Deleted — sent after a user's account has been permanently deleted
 */

import { emailLayout, emailHeading, emailText, emailDivider } from "./components.js";

export interface AccountDeletedData {
    username: string;
}

export function accountDeletedTemplate(data: AccountDeletedData): string {
    return emailLayout(`
        ${emailHeading("Your account has been deleted")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText("Your KeeperLog account and all associated data have been permanently deleted. This includes your enclosures, sensor data, care logs, alert rules, and settings.")}
        ${emailDivider()}
        ${emailText("If you ever want to come back, you're welcome to create a new account at any time.", true)}
        ${emailText("Thanks for using KeeperLog — we wish you all the best with your reptiles.", true)}
    `);
}
