import { emailLayout, emailHeading, emailText, emailButton, emailInfoBox } from "./components.js";

export interface DataExportReadyData {
    username: string;
    downloadUrl: string;
    expiresInHours: number;
    fileSizeKb: number;
}

export function dataExportReadyTemplate(data: DataExportReadyData): string {
    return emailLayout(`
        ${emailHeading("Your data export is ready")}
        ${emailText(`Hey <strong style="color:#e5e5e5;">${data.username}</strong>,`)}
        ${emailText(`Your GDPR data export has been generated successfully. The file is <strong>${data.fileSizeKb} KB</strong> and contains all your personal data stored in KeeperLog.`)}
        ${emailButton({ text: "Download Export →", href: data.downloadUrl })}
        ${emailInfoBox({ text: `This download link expires in <strong>${data.expiresInHours} hours</strong>. After that, you'll need to request a new export. For security reasons, keep this file safe and don't share the download link.` })}
    `);
}
