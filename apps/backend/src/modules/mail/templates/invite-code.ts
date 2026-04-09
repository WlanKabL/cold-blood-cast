/**
 * Invite Code — sent when an admin generates an invite for someone
 */

import {
    emailLayout,
    emailHeading,
    emailText,
    emailButton,
    emailCode,
    emailInfoBox,
} from "./components.js";

export interface InviteCodeData {
    inviteCode: string;
    registerUrl: string;
    invitedBy?: string;
    expiresAt?: string;
    maxUses?: number;
}

export function inviteCodeTemplate(data: InviteCodeData): string {
    const inviterLine = data.invitedBy
        ? emailText(
              `You've been invited by <strong style="color:#e5e5e5;">${data.invitedBy}</strong> to join KeeperLog.`,
          )
        : emailText(
              "You've been invited to join KeeperLog — real-time terrarium monitoring and alerts.",
          );

    const usageLine =
        data.maxUses && data.maxUses > 1
            ? emailInfoBox({
                  text: `This code can be used <strong>${data.maxUses} times</strong>.`,
                  type: "info",
              })
            : "";

    const expiryLine = data.expiresAt
        ? emailInfoBox({
              text: `This invite expires on <strong>${data.expiresAt}</strong>.`,
              type: "warning",
          })
        : "";

    return emailLayout(`
        ${emailHeading("You're invited! 🎫")}
        ${inviterLine}
        ${emailText("Use the code below to create your account:")}
        ${emailCode(data.inviteCode)}
        ${emailButton({ text: "Create Account →", href: data.registerUrl })}
        ${usageLine}
        ${expiryLine}
    `);
}
