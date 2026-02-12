"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleFormsWebhook = exports.whatsappWebhook = exports.moveCard = exports.sendWhatsappMediaMessage = exports.sendWhatsappMessage = void 0;
// src/index.ts
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Export all functions
var whatsapp_1 = require("./callable/whatsapp");
Object.defineProperty(exports, "sendWhatsappMessage", { enumerable: true, get: function () { return whatsapp_1.sendWhatsappMessage; } });
Object.defineProperty(exports, "sendWhatsappMediaMessage", { enumerable: true, get: function () { return whatsapp_1.sendWhatsappMediaMessage; } });
var cardActions_1 = require("./cardActions");
Object.defineProperty(exports, "moveCard", { enumerable: true, get: function () { return cardActions_1.moveCard; } });
var whatsapp_2 = require("./webhooks/whatsapp");
Object.defineProperty(exports, "whatsappWebhook", { enumerable: true, get: function () { return whatsapp_2.whatsappWebhook; } });
var googleForms_1 = require("./webhooks/googleForms");
Object.defineProperty(exports, "googleFormsWebhook", { enumerable: true, get: function () { return googleForms_1.googleFormsWebhook; } });
// fixCors eliminado porque ya cumplió su función
//# sourceMappingURL=index.js.map