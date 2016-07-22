# Angular 2 - Composer

Note:: You can create your own components that are customised for your application.
`Composer` does all the heavy lifting allowing maximum flexibility for app integration.

### Binding Directive

The `binding` attribute can be attached to any element to manage the data for a device property.

`<div binding [(value)]="value" [sys]="'sys-B0'" [mod]="module" [index]="2" [bind]="'power'"></div>`

* `sys` the identifier of the system that which is being used.
* `mod` is the identifier of the selected module. e.g. 'Display'.
* `index` the index of the module named in the system. e.g. For Display 2 the index would be 2.
    * `index` is optional and defaults to 1 if undefined.
* `bind` is the property that will be bound to on the selected module. e.g. 'power'.
* `value` is the parameter used to change the value of the property bound on the selected module.
* `exec` is used to define the name of the function on the server when the `value` has changed.
    * `exec` is optional and may be defined as empty. If undefined changes to `value` do nothing. If empty exec will execute the function on the server to change the value of `bind`.

All values can be variables or constants. `value` is bound two-way so that updates from server are applied to `value`.

### Debug Directive

The `debug` attribute can be attached to any element to get logging information for the selected device.

`<div debug [(output)]="value" [sys]="'sys-B0'" [mod]="module" [index]="2" enabled="true"></div>`

* `sys` the identifier of the system that which is being used.
* `mod` is the identifier of the selected module. e.g. 'Display'.
* `index` the index of the module named in the system. e.g. For Display 2 the index would be 2.
    * `index` is optional and defaults to 1 if undefined.
* `enabled` is the property if debugging is enabled.
* `output` is the parameter used to get the logging messages for the set module.

### System Service

### Resources Service

## License

MIT © [Alex Sorafumo](alex@yuion.net)
