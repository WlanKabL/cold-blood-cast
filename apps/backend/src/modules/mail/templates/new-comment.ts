/**
 * New Comment Email — sent to profile owners when they receive a new comment (opt-in)
 */

import { emailLayout, emailHeading, emailText, emailDivider, emailInfoBox } from "./components.js";

export interface NewCommentData {
    profileName: string;
    authorName: string;
    content: string;
}

export function newCommentTemplate(data: NewCommentData): string {
    return emailLayout(`
        ${emailHeading("💬 New Comment")}
        ${emailText(`Someone left a comment on <strong style="color:#e5e5e5;">${data.profileName}</strong>.`)}
        ${emailDivider()}
        ${emailInfoBox({ text: `<strong>${data.authorName}</strong><br/><br/>${data.content}`, type: "info" })}
        ${emailDivider()}
        ${emailText("Log in to view and manage your comments.", true)}
        ${emailText("You can disable comment notifications in your profile settings.", true)}
    `);
}
