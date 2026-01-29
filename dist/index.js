"use strict";
/**
 * WOPR Signal Plugin - signal-cli integration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const winston_1 = __importDefault(require("winston"));
const client_js_1 = require("./client.js");
const daemon_js_1 = require("./daemon.js");
// Module-level state
let ctx = null;
let config = {};
let agentIdentity = { name: "WOPR", emoji: "👀" };
let daemonHandle = null;
let abortController = null;
let messageCache = new Map();
let sseRetryTimeout = null;
let isShuttingDown = false;
let logger;
// Initialize winston logger
function initLogger() {
    const WOPR_HOME = process.env.WOPR_HOME || node_path_1.default.join(process.env.HOME || "~", ".wopr");
    return winston_1.default.createLogger({
        level: "debug",
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
        defaultMeta: { service: "wopr-plugin-signal" },
        transports: [
            new winston_1.default.transports.File({
                filename: node_path_1.default.join(WOPR_HOME, "logs", "signal-plugin-error.log"),
                level: "error",
            }),
            new winston_1.default.transports.File({
                filename: node_path_1.default.join(WOPR_HOME, "logs", "signal-plugin.log"),
                level: "debug",
            }),
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                level: "warn",
            }),
        ],
    });
}
// Config schema for the plugin
const configSchema = {
    title: "Signal Integration",
    description: "Configure Signal integration using signal-cli",
    fields: [
        {
            name: "account",
            type: "text",
            label: "Signal Account",
            placeholder: "+1234567890",
            description: "Your Signal phone number (E.164 format)",
        },
        {
            name: "cliPath",
            type: "text",
            label: "signal-cli Path",
            placeholder: "signal-cli",
            default: "signal-cli",
            description: "Path to signal-cli executable",
        },
        {
            name: "httpHost",
            type: "text",
            label: "HTTP Host",
            placeholder: "127.0.0.1",
            default: "127.0.0.1",
            description: "Host for signal-cli HTTP daemon",
        },
        {
            name: "httpPort",
            type: "number",
            label: "HTTP Port",
            placeholder: "8080",
            default: 8080,
            description: "Port for signal-cli HTTP daemon",
        },
        {
            name: "autoStart",
            type: "boolean",
            label: "Auto-start Daemon",
            default: true,
            description: "Automatically start signal-cli daemon",
        },
        {
            name: "dmPolicy",
            type: "select",
            label: "DM Policy",
            placeholder: "pairing",
            default: "pairing",
            description: "How to handle direct messages",
        },
        {
            name: "allowFrom",
            type: "array",
            label: "Allowed Senders",
            placeholder: "+1234567890, uuid:xxx",
            description: "Phone numbers or UUIDs allowed to DM",
        },
        {
            name: "groupPolicy",
            type: "select",
            label: "Group Policy",
            placeholder: "allowlist",
            default: "allowlist",
            description: "How to handle group messages",
        },
        {
            name: "mediaMaxMb",
            type: "number",
            label: "Media Max Size (MB)",
            placeholder: "8",
            default: 8,
            description: "Maximum attachment size in MB",
        },
        {
            name: "ignoreAttachments",
            type: "boolean",
            label: "Ignore Attachments",
            default: false,
            description: "Don't download attachments",
        },
        {
            name: "sendReadReceipts",
            type: "boolean",
            label: "Send Read Receipts",
            default: false,
            description: "Send read receipts for incoming messages",
        },
    ],
};
// Refresh identity from workspace
async function refreshIdentity() {
    if (!ctx)
        return;
    try {
        const identity = await ctx.getAgentIdentity();
        if (identity) {
            agentIdentity = { ...agentIdentity, ...identity };
            logger.info("Identity refreshed:", agentIdentity.name);
        }
    }
    catch (e) {
        logger.warn("Failed to refresh identity:", String(e));
    }
}
function getAckReaction() {
    return agentIdentity.emoji?.trim() || "👀";
}
function getBaseUrl() {
    if (config.httpUrl)
        return config.httpUrl;
    const host = config.httpHost || "127.0.0.1";
    const port = config.httpPort || 8080;
    return `http://${host}:${port}`;
}
function normalizeE164(phone) {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    if (!/^\+?[0-9]+$/.test(cleaned))
        return null;
    return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}
function isAllowed(sender, isGroup) {
    if (isGroup) {
        const policy = config.groupPolicy || "allowlist";
        if (policy === "open")
            return true;
        if (policy === "disabled")
            return false;
        const allowed = config.groupAllowFrom || config.allowFrom || [];
        if (allowed.includes("*"))
            return true;
        return allowed.some((id) => id === sender ||
            id === `uuid:${sender}` ||
            normalizeE164(id) === normalizeE164(sender));
    }
    else {
        const policy = config.dmPolicy || "pairing";
        if (policy === "open")
            return true;
        if (policy === "disabled")
            return false;
        if (policy === "pairing") {
            // In pairing mode, all unknown senders get a pairing request
            return true;
        }
        // allowlist mode
        const allowed = config.allowFrom || [];
        if (allowed.includes("*"))
            return true;
        return allowed.some((id) => id === sender ||
            id === `uuid:${sender}` ||
            normalizeE164(id) === normalizeE164(sender));
    }
}
function parseSignalEvent(event) {
    if (!event.data)
        return null;
    try {
        const data = JSON.parse(event.data);
        // Only handle message events
        if (event.event !== "message")
            return null;
        const envelope = data.envelope;
        if (!envelope)
            return null;
        // Skip our own messages
        if (envelope.source === config.account)
            return null;
        const timestamp = envelope.timestamp || Date.now();
        const messageId = `${timestamp}-${envelope.source}`;
        let text = "";
        let attachments = [];
        let quote;
        const dataMessage = envelope.dataMessage;
        if (dataMessage) {
            text = dataMessage.message || "";
            if (dataMessage.attachments) {
                attachments = dataMessage.attachments.map((att) => ({
                    id: att.id,
                    contentType: att.contentType,
                    filename: att.filename,
                    size: att.size,
                }));
            }
            if (dataMessage.quote) {
                quote = {
                    text: dataMessage.quote.text,
                    author: dataMessage.quote.author,
                };
            }
        }
        const syncMessage = envelope.syncMessage;
        if (syncMessage?.sentMessage) {
            // This is a sync of our own sent message, skip
            return null;
        }
        const isGroup = Boolean(dataMessage?.groupInfo?.groupId);
        const groupId = dataMessage?.groupInfo?.groupId;
        return {
            id: messageId,
            from: envelope.source,
            fromMe: false,
            timestamp,
            text,
            isGroup,
            groupId,
            sender: envelope.sourceName || envelope.source,
            senderNumber: envelope.sourceNumber,
            senderUuid: envelope.sourceUuid,
            attachments,
            quote,
        };
    }
    catch (err) {
        logger.error("Failed to parse Signal event:", err);
        return null;
    }
}
async function handleIncomingMessage(msg) {
    if (!ctx)
        return;
    // Check if sender is allowed
    if (!isAllowed(msg.from, msg.isGroup)) {
        logger.info(`Message from ${msg.from} blocked by policy`);
        return;
    }
    // Build channel info
    const channelId = msg.isGroup && msg.groupId ? `group:${msg.groupId}` : msg.from;
    const channelInfo = {
        type: "signal",
        id: channelId,
        name: msg.isGroup ? "Signal Group" : "Signal DM",
    };
    // Log for context
    const logOptions = {
        from: msg.sender || msg.from,
        channel: channelInfo,
    };
    const sessionKey = `signal-${channelId}`;
    ctx.logMessage(sessionKey, msg.text || "[media]", logOptions);
    // Cache message for reaction handling
    messageCache.set(msg.id, msg);
    // Inject to WOPR
    await injectMessage(msg, sessionKey);
}
async function injectMessage(signalMsg, sessionKey) {
    if (!ctx || !signalMsg.text)
        return;
    const prefix = `[${signalMsg.sender || "Signal User"}]: `;
    const messageWithPrefix = prefix + signalMsg.text;
    const channelInfo = {
        type: "signal",
        id: signalMsg.isGroup && signalMsg.groupId ? `group:${signalMsg.groupId}` : signalMsg.from,
        name: signalMsg.isGroup ? "Signal Group" : "Signal DM",
    };
    const response = await ctx.inject(sessionKey, messageWithPrefix, {
        from: signalMsg.sender || signalMsg.from,
        channel: channelInfo,
    });
    // Send response
    const target = signalMsg.isGroup && signalMsg.groupId
        ? `group:${signalMsg.groupId}`
        : signalMsg.from;
    await sendMessageInternal(target, response);
}
async function sendMessageInternal(to, text, opts) {
    const baseUrl = getBaseUrl();
    const account = config.account;
    // Parse target
    let targetType = "recipient";
    let recipient;
    let groupId;
    if (to.toLowerCase().startsWith("group:")) {
        targetType = "group";
        groupId = to.slice(6);
    }
    else {
        recipient = to;
    }
    // Build params
    const params = {
        message: text,
    };
    if (account)
        params.account = account;
    if (targetType === "group") {
        params.groupId = groupId;
    }
    else {
        params.recipient = [recipient];
    }
    if (opts?.mediaUrl) {
        params.attachments = [opts.mediaUrl];
    }
    await (0, client_js_1.signalRpcRequest)("send", params, { baseUrl });
}
async function runSseLoop() {
    if (isShuttingDown)
        return;
    const baseUrl = getBaseUrl();
    abortController = new AbortController();
    try {
        logger.info("Starting Signal SSE stream...");
        await (0, client_js_1.streamSignalEvents)({
            baseUrl,
            account: config.account,
            abortSignal: abortController.signal,
            onEvent: (event) => {
                const msg = parseSignalEvent(event);
                if (msg) {
                    handleIncomingMessage(msg).catch((err) => {
                        logger.error("Error handling Signal message:", err);
                    });
                }
            },
        });
    }
    catch (err) {
        if (isShuttingDown)
            return;
        const errorMsg = err instanceof Error ? err.message : String(err);
        logger.error("Signal SSE error:", errorMsg);
        // Retry with exponential backoff
        const retryDelay = Math.min(5000 * Math.pow(2, (sseRetryTimeout ? 1 : 0)), 30000);
        logger.info(`Retrying SSE connection in ${retryDelay}ms...`);
        sseRetryTimeout = setTimeout(() => {
            if (!isShuttingDown) {
                runSseLoop().catch((err) => {
                    logger.error("Fatal SSE loop error:", err);
                });
            }
        }, retryDelay);
    }
}
async function startSignal() {
    const baseUrl = getBaseUrl();
    // Check if already running
    const check = await (0, client_js_1.signalCheck)(baseUrl, 2000);
    if (check.ok) {
        logger.info("Signal daemon already running");
        await runSseLoop();
        return;
    }
    // Auto-start if enabled
    if (config.autoStart !== false) {
        logger.info("Starting Signal daemon...");
        daemonHandle = (0, daemon_js_1.spawnSignalDaemon)({
            cliPath: config.cliPath || "signal-cli",
            account: config.account,
            httpHost: config.httpHost || "127.0.0.1",
            httpPort: config.httpPort || 8080,
            receiveMode: config.receiveMode,
            ignoreAttachments: config.ignoreAttachments,
            ignoreStories: config.ignoreStories,
            sendReadReceipts: config.sendReadReceipts,
            runtime: {
                log: (msg) => logger.info(msg),
                error: (msg) => logger.error(msg),
            },
        });
        logger.info(`Signal daemon started (PID: ${daemonHandle.pid})`);
        // Wait for daemon to be ready
        await (0, daemon_js_1.waitForSignalDaemonReady)(baseUrl, 30000, {
            log: (msg) => logger.info(msg),
            error: (msg) => logger.error(msg),
        });
        // Start SSE loop
        await runSseLoop();
    }
    else {
        logger.error("Signal daemon not running and auto-start disabled. Please start signal-cli manually.");
        throw new Error("Signal daemon not available");
    }
}
// Plugin definition
const plugin = {
    name: "signal",
    version: "1.0.0",
    description: "Signal integration using signal-cli",
    async init(context) {
        ctx = context;
        config = (context.getConfig() || {});
        // Initialize logger
        logger = initLogger();
        // Register config schema
        ctx.registerConfigSchema("signal", configSchema);
        // Refresh identity
        await refreshIdentity();
        // Validate config
        if (!config.account) {
            logger.warn("No Signal account configured. Run 'wopr configure --plugin signal' to set up.");
            return;
        }
        // Start Signal
        try {
            await startSignal();
        }
        catch (err) {
            logger.error("Failed to start Signal:", err);
            // Don't throw - let plugin load but log the error
        }
    },
    async shutdown() {
        isShuttingDown = true;
        if (sseRetryTimeout) {
            clearTimeout(sseRetryTimeout);
            sseRetryTimeout = null;
        }
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        if (daemonHandle) {
            logger.info("Stopping Signal daemon...");
            daemonHandle.stop();
            daemonHandle = null;
        }
        ctx = null;
    },
};
exports.default = plugin;
//# sourceMappingURL=index.js.map