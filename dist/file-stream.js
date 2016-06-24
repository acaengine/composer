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
var FileStream = (function () {
    function FileStream(elementRef, _dropService) {
        this._dropService = _dropService;
        this._element = elementRef.nativeElement;
    }
    // Hook up the file selection box with an event handler to
    // push the files to the selected stream
    FileStream.prototype.ngOnInit = function () {
        var self = this;
        self._element.addEventListener('change', function () {
            self._dropService.pushFiles(self.fileStream, this.files);
        }, false);
    };
    FileStream = __decorate([
        core_2.Directive({
            selector: '[fileStream]',
            // If added as a provider then a new instance is created for every DropTarget
            // this is not desirable and as drop service should be available application wide
            // it should be added to the initial bootstrap
            inputs: [
                'fileStream' // name of the stream the files should be sent to
            ]
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef, drop_service_1.DropService])
    ], FileStream);
    return FileStream;
})();
exports.FileStream = FileStream;
//# sourceMappingURL=file-stream.js.map