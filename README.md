# Introduction

Allows you to place multiple drag and drop hotspots onto a webpage.

* Multiple observable streams can be setup for dropped files
* Multiple hotspots can provide files to a shared stream
* Only one stream will highlight at a time (See note below)
* Supports both drag and drop and file dialogs
* File data is normalised for ease of use
  * Where possible file path information is retained - if a folder is dropped

NOTE: If multiple hotspots are defined for a single stream then all those
hotspots will activate when a user hovers over any of them. This improves
discoverability.


## Usage

Note:: You can create your own directive that is customised for your application.
`DropService` does all the heavy lifting allowing maximum flexibility for app integration.

### Drag and Drop Directive

1. Include the directive in your Component or Directive
     * `import {DropTarget} from 'a2-file-drop/dist/drop-target';`
2. Add the directive to the target elements
     * `<div drop-target drop-stream="media-uploads" drop-indicate="hover-class"></div>`

### File Input Directive

1. Include the directive in your Component or Directive
     * `import {FileStream} from 'a2-file-drop/dist/file-stream';`
2. Add the directive to the target elements
     * `<input type="file" multiple file-stream="media-uploads">`

### Processing the files once they have been dropped

1. Create a service that will `import {DropService} from 'a2-file-drop/dist/drop-service';`
2. Ensure dropservice is only initialised once `bootstrap(App, [DropService]);`
3. Observe events coming from the relevent file stream
    * Inject the dependency `constructor(dropService: DropService) {}`
    * `var stream = dropService.getStream('media');`
    * `stream.filter().map()` etc etc
    * then:

```typescript

stream.subscribe((obj) => {
    if (obj.data && obj.event === 'drop') {
        obj.data.promise.then((data) => {
            // At this point all file data has been collected
            console.log(data.files);
        });
    }
});

// OR

stream.filter((obj) => {
    // Files only available on a drop event
    return obj.data && obj.data.length > 0;
}).flatMap((obj) => {
    // Wait for the files to be collected
    return obj.data.promise;
}).map((obj) => {
    // Return just the array of files
    return obj.files;
}).subscribe((files) => {
    console.log(files);
});

```

The subscription emit events:

* `'over'`: There is currently a hover event
* `'left'`: There is no more hover event
* `'drop'`: Files have been dropped or selected


## Options

* `drop-target="#selector"` if you want to use a different element as your actual target (html, body etc)
    * This makes drop box style apps where the whole page is a drop target possible
    * Defaults to the element defined on if no selector is provided
* `drop-stream="stream name"` is the name your upload logic will use to recieve dropped file data
* `drop-indicate="class-name"` is the class added to the drop-target when the mouse pointer is above


## Building from src

The project is written in typescript and transpiled into ES5.

1. Install TypeScript: `npm install -g typescript` (if you haven't already)
2. Configure compile options in `tsconfig.json`
3. Perform build using: `tsc`

You can find more information here: https://github.com/Microsoft/TypeScript/wiki/tsconfig.json

## Scripts

1. Build Script: `npm run build`
2. Test Script: `npm run test`


## Publishing

1. Sign up to https://www.npmjs.com/
2. Configure `package.json` https://docs.npmjs.com/files/package.json
3. run `npm publish` https://docs.npmjs.com/cli/publish


# License

MIT
