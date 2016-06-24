export declare class DropFiles {
    promise: Promise<DropFiles>;
    length: number;
    totalSize: number;
    files: Array<any>;
    calculating: boolean;
    private _pending;
    private resolve;
    private reject;
    constructor(event: any);
    private _processPending();
    private _completeProcessing();
}
