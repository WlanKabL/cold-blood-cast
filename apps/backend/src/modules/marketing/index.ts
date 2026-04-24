export { marketingRoutes } from "./marketing.routes.js";
export { adminMarketingRoutes } from "./admin-marketing.routes.js";
export {
    bindAttributionToUser,
    recordRegistrationEvent,
    recordLandingAttribution,
    markBrowserEventDelivered,
} from "./marketing.service.js";
export {
    enqueueMarketingEventDispatch,
    startMarketingWorker,
    stopMarketingWorker,
    MARKETING_QUEUE_NAME,
} from "./marketing.queue.js";
export { buildCanonicalEventId } from "./event-id.js";
export { decideMarketingDispatch } from "./consent-matrix.js";
export {
    recordActivationEvent,
    recordFirstCareEntryActivation,
} from "./activation.service.js";
export {
    getMarketingConfig,
    updateMarketingSettings,
    invalidateMarketingConfigCache,
} from "./marketing-config.service.js";
export { recordHighValueEvent } from "./high-value-events.service.js";
export {
    createAudienceExport,
    listAudienceExports,
    findExportByToken,
    deleteAudienceExport,
    expireOldAudienceExports,
} from "./audience-export.service.js";
export {
    registerAudienceSyncProvider,
    getAudienceSyncProvider,
} from "./audience-sync.service.js";
export { buildRoiReport } from "./roi-report.service.js";
