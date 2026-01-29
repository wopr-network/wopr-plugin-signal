/**
 * Signal CLI Client - JSON-RPC and SSE support
 */
export interface SignalRpcOptions {
    baseUrl: string;
    timeoutMs?: number;
}
export interface SignalEvent {
    event?: string;
    data?: string;
    id?: string;
}
export interface SignalEventParams {
    baseUrl: string;
    account?: string;
    abortSignal?: AbortSignal;
    onEvent: (event: SignalEvent) => void;
}
export declare function signalRpcRequest<T = any>(method: string, params: Record<string, any>, opts: SignalRpcOptions): Promise<T>;
export declare function signalCheck(baseUrl: string, timeoutMs?: number): Promise<{
    ok: boolean;
    status: number | null;
    error: string | null;
}>;
export declare function streamSignalEvents(params: SignalEventParams): Promise<void>;
//# sourceMappingURL=client.d.ts.map