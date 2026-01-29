/**
 * Signal CLI Daemon Management
 */
export interface SignalDaemonOptions {
    cliPath: string;
    account?: string;
    httpHost: string;
    httpPort: number;
    receiveMode?: "native" | "manually";
    ignoreAttachments?: boolean;
    ignoreStories?: boolean;
    sendReadReceipts?: boolean;
    runtime?: {
        log?: (msg: string) => void;
        error?: (msg: string) => void;
    };
}
export interface SignalDaemonHandle {
    pid?: number;
    stop: () => void;
}
export declare function spawnSignalDaemon(opts: SignalDaemonOptions): SignalDaemonHandle;
export declare function waitForSignalDaemonReady(baseUrl: string, timeoutMs?: number, runtime?: {
    log?: (msg: string) => void;
    error?: (msg: string) => void;
}): Promise<void>;
//# sourceMappingURL=daemon.d.ts.map