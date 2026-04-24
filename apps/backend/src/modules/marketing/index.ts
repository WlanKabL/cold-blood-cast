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
