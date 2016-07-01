
## Usage

Note:: You can create your own components that are customised for your application.
`Composer` does all the heavy lifting allowing maximum flexibility for app integration.

## Example

The `binding` attribute can be attached to any element to manage the data for a
device property.

`<div binding [value]="value" [sys]="'sys-B0'" [mod]="module" [index]="2" [bind]="'power'" (change)="value=$event"></div>`

* `sys` the identifier of the system that which is being used.
* `mod` is the identifier of the selected module. e.g. 'Display'.
* `index` the index of the module named in the system. e.g. For Display 2 the index would be 2.
    * `index` is optional and defaults to 1 if undefined.
* `bind` is the property that will be bound to on the selected module. e.g. 'power'.
* `value` is the parameter used to change the value of the property bound on the selected module.
* `exec` is used to define the name of the function on the server when the `value` has changed.
    * `exec` is optional and may be defined as empty. If undefined changes to `value` do nothing. If empty exec will execute the function on the server to change the value of `bind`.
* `(changed)` is called when the value has changed on the server and can be used to update the local value;

 `value` must be a variable for this directive to work. All other parameter can be defined as variables or literal values.

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
