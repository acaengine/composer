// Require what we need from rxjs
import {Observable} from 'rxjs/Rx';
import {DropFiles} from './drop-files';

export class DropService {
    // All the elements we are interested in highlighting when the mouse is over them
    private _dropTargets:  HTMLScriptElement[] = [];
    private _currentTarget:HTMLScriptElement;

    // These track the relationship between elements, callbacks and file streams
    private _streams       = {}; // stream name => shared observable
    private _observers     = {}; // stream name => observer
    private _streamMapping = {}; // stream name => element array
    private _callbacks     = {}; // stream name => callback array

    // This are our event observables
    private _drop:     any;
    private _dragenter:any;
    private _dragover: any;
    private _dragleave:any;

    // Tracks the number of dragenter events by tracking
    // the target elements (works around a firefox issue)
    private _counter = new Set();


    constructor() {
        var self = this,
            overFired;

        // Define the event streams
        self._drop = Observable.fromEvent(window, 'drop')
            .map(self._preventDefault)
            .filter(self._checkTarget.bind(self));

        // Prevent default on all dragover events
        self._dragover = Observable.fromEvent(window, 'dragover').subscribe((event: Event) => {
            event.preventDefault();
        });

        self._dragenter = Observable.fromEvent(window, 'dragenter')
            .map(self._preventDefault)
            .filter(self._checkTarget.bind(self));

        self._dragleave = Observable.fromEvent(window, 'dragleave')
            .map(self._preventDefault)
            .filter(function (event) {
                var dropTargets = self._dropTargets,
                    target = event.target,
                    i:number;

                self._counter.delete(target);

                // Exit early if the current counter is 0
                // This means we've left the body
                if (self._counter.size <= 0) {
                    self._counter = new Set();

                    if (self._currentTarget) {
                        self._performCallback(self._currentTarget, false);
                        self._currentTarget = null;
                    }
                } else {
                    for (i = 0; i < dropTargets.length; i += 1) {
                        if (dropTargets[i] === target) {
                            return true;
                        }
                    }
                }

                return false;
            });

        // Start watching for the events
        self._dragenter.subscribe((obj) => {
            overFired = obj.target;
            self._updateClasses(obj);
        });
        self._dragleave.subscribe((obj) => {
            if (!overFired) {
                self._removeClass(obj);
            }
            overFired = null;
        });
        self._drop.subscribe((obj) => {
            var observer = self._removeClass(obj);

            // Stream the files
            if (observer) {
                observer.next({
                    event:'drop',
                    data: new DropFiles(obj.originalEvent)
                });
            }
        });
    }


    // Configures an element to become a drop target
    register(name: string, element: HTMLScriptElement, callback: (state: boolean) => void) {
        var self = this;

        // Register the drop-target
        self._ensureStream(name);
        self._streamMapping[name].push(element);
        self._callbacks[name].push(callback);
        self._dropTargets.push(element);

        // Return the unregister/cleanup callback
        return function () {
            var index:number = self._dropTargets.indexOf(element);
            if (index !== -1) {
                self._dropTargets.splice(index, 1);

                // If it is in the drop targets then it will be here
                index = self._streamMapping[name].indexOf(element);
                self._streamMapping[name].splice(index, 1);
                self._callbacks[name].splice(index, 1);
            }
        };
    }

    pushFiles(stream:string, files) {
        var observer = this._observers[stream];
        if (observer) {
            observer.next({
                event: 'drop',
                data: new DropFiles({
                    dataTransfer: {
                        files: files
                    }
                })
            });
        }
    }

    // Hooks up a function to recieve a the files from a particular stream
    // 3 events: 'over', 'left', 'drop'
    getStream(name: string) {
        this._ensureStream(name);
        return this._streams[name];
    }


    // Initialises a new file stream if it did not exist
    private _ensureStream(name: string) {
        if (!this._streams[name]) {
            var self = this;

            self._streams[name] = new Observable<{ event: string, data?: DropFiles }>(function(observer) {
                self._observers[name] = observer;

                return function() {
                    self._observers[name] = null;
                };
            }).share();
            self._observers[name] = null;
            self._streamMapping[name] = [];
            self._callbacks[name] = [];
        }
    }

    // The new stream object allows us to change the target (read only in the originalEvent)
    private _preventDefault(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        return {
            originalEvent: event,
            target: event.target,
            type: event.type
        };
    }

    // Checks if we need to perform a class addition or removal
    private _checkTarget(obj) {
        var self = this,
            dropTargets = self._dropTargets,
            target = obj.target;

        // We have to count the objects using a set as firefox
        // often fires events twice
        if (obj.type === 'dragenter') {
            self._counter.add(target);
        } else { // must be drop
            self._counter = new Set();
        }

        while (target) {
            if (dropTargets.indexOf(target) !== -1) {
                break;
            }

            target = target.parentNode;
        }

        obj.target = target;
        if (target || self._currentTarget)
            return true;

        return false;
    }

    // Returns the stream name for an element
    private _findStream(element: HTMLScriptElement) {
        var mapping = this._streamMapping,
            prop;

        for (prop in mapping) {
            if (mapping.hasOwnProperty(prop) && mapping[prop].indexOf(element) !== -1) {
                return prop;
            }
        }

        return null;
    }

    // Informs the element of its highlight state
    private _performCallback(target: HTMLScriptElement, state: boolean, stream: string = null) {
        stream = stream || this._findStream(target);

        this._callbacks[stream].forEach(function (cb) {
            cb(state);
        });

        // We return stream so we don't ever have to look it up twice
        return stream;
    }

    // Based on the current target, determines if a class change needs to occur
    private _updateClasses(obj) {
        var target = obj.target,
            currentTarget = this._currentTarget,
            stream:string;

        // Have we moved off a target
        if (currentTarget && currentTarget !== target) {
            stream = this._performCallback(currentTarget, false);
            this._notifyObservers(stream, {event: 'left'});
        }

        // Have we moved over a new target
        if (target && currentTarget !== target) {
            stream = this._performCallback(target, true);

            // If this is a new hover - let our subscribers know
            if (target) {
                this._notifyObservers(stream, {
                    event: 'over'
                });
            }
        }

        this._currentTarget = target;
    }

    private _removeClass(obj) {
        var stream:string = this._performCallback(obj.target, false);

        this._currentTarget = null;

        return this._notifyObservers(stream, {event: 'left'});
    }

    private _notifyObservers(stream:string, object: {event:string, data?:DropFiles}) {
        var observer = this._observers[stream];
        if (observer) {
            observer.next(object);
        }
        return observer;
    }
}
