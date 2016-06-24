import {ElementRef} from 'angular2/core';
import {Directive, OnInit} from 'angular2/core';
import {DropService} from './drop-service';


@Directive({
    selector: '[fileStream]',
    // If added as a provider then a new instance is created for every DropTarget
    // this is not desirable and as drop service should be available application wide
    // it should be added to the initial bootstrap
    inputs: [
        'fileStream'       // name of the stream the files should be sent to
    ]
})
export class FileStream implements OnInit {
    fileStream: string;
    private _element: any;


    constructor(elementRef: ElementRef, private _dropService: DropService) {
        this._element = elementRef.nativeElement;
    }

    // Hook up the file selection box with an event handler to
    // push the files to the selected stream
    ngOnInit() {
        var self = this;
        self._element.addEventListener('change', function () {
            self._dropService.pushFiles(self.fileStream, this.files);
        }, false);
    }
}
