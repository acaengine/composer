export declare class DropService {
    private _dropTargets;
    private _currentTarget;
    private _streams;
    private _observers;
    private _streamMapping;
    private _callbacks;
    private _drop;
    private _dragenter;
    private _dragover;
    private _dragleave;
    private _counter;
    constructor();
    register(name: string, element: HTMLScriptElement, callback: (state: boolean) => void): () => void;
    pushFiles(stream: string, files: any): void;
    getStream(name: string): any;
    private _ensureStream(name);
    private _preventDefault(event);
    private _checkTarget(obj);
    private _findStream(element);
    private _performCallback(target, state, stream?);
    private _updateClasses(obj);
    private _removeClass(obj);
    private _notifyObservers(stream, object);
}
