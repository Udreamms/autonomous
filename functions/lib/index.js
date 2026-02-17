"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webchatWebhook = exports.xWebhook = exports.telegramWebhook = exports.metaWebhook = exports.whatsappWebhook = void 0;
const admin = require("firebase-admin");
admin.initializeApp();
var whatsapp_1 = require("./webhooks/whatsapp");
Object.defineProperty(exports, "whatsappWebhook", { enumerable: true, get: function () { return whatsapp_1.whatsappWebhook; } });
var meta_1 = require("./webhooks/meta");
Object.defineProperty(exports, "metaWebhook", { enumerable: true, get: function () { return meta_1.metaWebhook; } });
var telegram_1 = require("./webhooks/telegram");
Object.defineProperty(exports, "telegramWebhook", { enumerable: true, get: function () { return telegram_1.telegramWebhook; } });
var x_1 = require("./webhooks/x");
Object.defineProperty(exports, "xWebhook", { enumerable: true, get: function () { return x_1.xWebhook; } });
var webchat_1 = require("./webhooks/webchat");
Object.defineProperty(exports, "webchatWebhook", { enumerable: true, get: function () { return webchat_1.webchatWebhook; } });
// Export others as they are created...
//# sourceMappingURL=index.js.map