import { env } from "../../config.js";

function baseLayout(content: string): string {
    const frontendUrl = env().FRONTEND_URL;
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #1a1a2e; color: #e0e0e0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #22c55e; margin: 0;">Cold Blood Cast</h2>
        </div>
        ${content}
        <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">
            <a href="${frontendUrl}" style="color: #22c55e; text-decoration: none;">Cold Blood Cast</a>
        </p>
    </div>`;
}

export function verifyEmailTemplate(data: {
    username: string;
    verifyUrl: string;
    code: string;
    expiresInMinutes: number;
}): string {
    return baseLayout(`
        <h3 style="color: #fff;">Verify your email</h3>
        <p>Hi ${data.username},</p>
        <p>Your verification code is:</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e; background: #222; padding: 12px 24px; border-radius: 8px;">${data.code}</span>
        </div>
        <p>This code expires in ${data.expiresInMinutes} minutes.</p>
        <p>Or click the link below:</p>
        <p style="text-align: center;">
            <a href="${data.verifyUrl}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Email</a>
        </p>
    `);
}

export function passwordResetTemplate(data: {
    username: string;
    resetUrl: string;
    expiresInMinutes: number;
}): string {
    return baseLayout(`
        <h3 style="color: #fff;">Reset your password</h3>
        <p>Hi ${data.username},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="${data.resetUrl}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </p>
        <p>This link expires in ${data.expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email.</p>
    `);
}

export function newLoginTemplate(data: {
    username: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}): string {
    return baseLayout(`
        <h3 style="color: #fff;">New login detected</h3>
        <p>Hi ${data.username},</p>
        <p>A new login to your account was detected:</p>
        <table style="width: 100%; margin: 16px 0; font-size: 14px;">
            <tr><td style="color: #888; padding: 4px 8px;">IP Address:</td><td style="padding: 4px 8px;">${data.ipAddress}</td></tr>
            <tr><td style="color: #888; padding: 4px 8px;">Device:</td><td style="padding: 4px 8px;">${data.userAgent}</td></tr>
            <tr><td style="color: #888; padding: 4px 8px;">Time:</td><td style="padding: 4px 8px;">${data.timestamp}</td></tr>
        </table>
        <p>If this wasn't you, change your password immediately.</p>
    `);
}

export function pendingReviewTemplate(data: { username: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">Registration under review</h3>
        <p>Hi ${data.username},</p>
        <p>Your registration has been received and is pending admin review. You'll receive another email once your account has been approved.</p>
    `);
}

export function accountApprovedTemplate(data: { username: string; loginUrl: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">Account approved!</h3>
        <p>Hi ${data.username},</p>
        <p>Your account has been approved. You can now log in:</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Log In</a>
        </p>
    `);
}

export function accountBannedTemplate(data: { username: string; reason?: string }): string {
    return baseLayout(`
        <h3 style="color: #ef4444;">Account suspended</h3>
        <p>Hi ${data.username},</p>
        <p>Your account has been suspended.${data.reason ? ` Reason: ${data.reason}` : ""}</p>
        <p>If you believe this is an error, please contact support.</p>
    `);
}

export function accountDeletedTemplate(data: { username: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">Account deleted</h3>
        <p>Hi ${data.username},</p>
        <p>Your account and all associated data have been permanently deleted. We're sorry to see you go.</p>
    `);
}

export function accountDeletionTemplate(data: {
    username: string;
    confirmUrl: string;
    expiresInHours: number;
}): string {
    return baseLayout(`
        <h3 style="color: #ef4444;">Confirm account deletion</h3>
        <p>Hi ${data.username},</p>
        <p>You requested to delete your account. This action is <strong>irreversible</strong>.</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="${data.confirmUrl}" style="display: inline-block; background: #ef4444; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Confirm Deletion</a>
        </p>
        <p>This link expires in ${data.expiresInHours} hours. If you didn't request this, ignore this email.</p>
    `);
}

export function accessRequestTemplate(data: { email: string; reason?: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">New access request</h3>
        <p>A new access request has been submitted:</p>
        <table style="width: 100%; margin: 16px 0; font-size: 14px;">
            <tr><td style="color: #888; padding: 4px 8px;">Email:</td><td style="padding: 4px 8px;">${data.email}</td></tr>
            ${data.reason ? `<tr><td style="color: #888; padding: 4px 8px;">Reason:</td><td style="padding: 4px 8px;">${data.reason}</td></tr>` : ""}
        </table>
        <p>Review this request in the admin panel.</p>
    `);
}

export function accessRequestRejectedTemplate(data: { email: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">Access request update</h3>
        <p>Hi,</p>
        <p>Your access request for Cold Blood Cast has been reviewed and was not approved at this time.</p>
    `);
}

export function inviteCodeTemplate(data: {
    email: string;
    inviteCode: string;
    registerUrl: string;
}): string {
    return baseLayout(`
        <h3 style="color: #fff;">You've been invited!</h3>
        <p>Hi,</p>
        <p>You've been invited to join Cold Blood Cast. Use the code below to register:</p>
        <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #22c55e; background: #222; padding: 12px 24px; border-radius: 8px;">${data.inviteCode}</span>
        </div>
        <p style="text-align: center;">
            <a href="${data.registerUrl}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Register Now</a>
        </p>
    `);
}

export function dataExportReadyTemplate(data: {
    username: string;
    downloadUrl: string;
    expiresInHours: number;
}): string {
    return baseLayout(`
        <h3 style="color: #fff;">Your data export is ready</h3>
        <p>Hi ${data.username},</p>
        <p>Your data export has been generated and is ready for download:</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="${data.downloadUrl}" style="display: inline-block; background: #22c55e; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Download Export</a>
        </p>
        <p>This link expires in ${data.expiresInHours} hours.</p>
    `);
}

export function customTemplate(data: { subject: string; body: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">${data.subject}</h3>
        ${data.body}
    `);
}

export function unsubscribeConfirmTemplate(data: { email: string }): string {
    return baseLayout(`
        <h3 style="color: #fff;">Unsubscribed</h3>
        <p>You have been successfully unsubscribed from Cold Blood Cast notification emails.</p>
    `);
}
