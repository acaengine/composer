var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('angular2/core');
var core_2 = require('angular2/core');
var drop_service_1 = require('./drop-service');
var DropTarget = (function () {
    function DropTarget(elementRef, _dropService) {
        this._dropService = _dropService;
        this.dropIndicate = 'drop-indicate';
        this._element = elementRef.nativeElement;
    }
    // Register the element you want to recieve drop events
    DropTarget.prototype.ngOnInit = function () {
        var self = this;
        if (self.dropTarget) {
            self._element = document.querySelector(self.dropTarget);
        }
        self._unreg = self._dropService.register(self.dropStream, self._element, self._doHighlight.bind(self));
    };
    // Ensure all the bindings and classes are removed
    DropTarget.prototype.ngOnDestroy = function () {
        this._unreg();
        // In case the drop-target is another element (not the ElementRef)
        this._doHighlight(false);
    };
    // Applies the hover class to the element
    DropTarget.prototype._doHighlight = function (state) {
        if (state) {
            this._element.classList.add(this.dropIndicate);
        }
        else {
            this._element.classList.remove(this.dropIndicate);
        }
    };
    DropTarget = __decorate([
        core_2.Directive({
            selector: '[dropTarget]',
            // If added as a provider then a new instance is created for every DropTarget
            // this is not desirable and as drop service should be available application wide
            // it should be added to the initial bootstrap
            //providers: [DropService],
            inputs: [
                'dropTarget',
                'dropIndicate',
                'dropStream' // name of the stream the files should be sent to
            ]
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef, drop_service_1.DropService])
    ], DropTarget);
    return DropTarget;
})();
exports.DropTarget = DropTarget;
//# sourceMappingURL=drop-target.js.map