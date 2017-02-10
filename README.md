
# Angular 2 - Composer Library

Note:: You can create your own components that are customised for your application.
`Composer` does all the heavy lifting allowing maximum flexibility for app integration.

## Directives

### Binding

The `binding` attribute can be attached to any element to manage the data for a device property.

`<div binding [(value)]="value" [sys]="'sys-B0'" [mod]="module" [index]="2" [bind]="'power'" exec="switch" [params]="[value, value1, value2]"></div>`

Name | Binding | Direction | Valid Types | Description
-----|----------|-----------|-------------|------------
`value`| Two-way | Read & Write | String | Value of the bound. Updates when servers value is changed.
`sys`| One-way | Write-only | String | Identifier of the system to connect
`mod`| One-way | Write-only | String | Identifier of the module in the system to use e.g. Display
`index`| One-way | Write-only | Number | Index of the module in the system. Default: 1
`bind`| One-way | Write-only | String | Name of the variable in module to bind
`exec`| One-way | Write-only | String | Name of the function to execute on the server when the binding value changes. If undefined no function call will occur. If defined as empty function name will be `bind` value
`params`| One-way | Write-only | Any[] | Array parameters to pass into the function on the server. Defaults to `value`

### Debug

The `debug` attribute can be attached to any element to get logging information for the selected device.

`<div debug [(output)]="value" [sys]="'sys-B0'" [mod]="module" [index]="2" enabled="true"></div>`

Name | Binding | Direction | Valid Types | Description
-----|----------|-----------|-------------|------------
`output`| Two-way | Read & Write | String | Array of Debugging messsages on set module
`sys`| One-way | Write-only | String | Identifier of the system to connect
`mod`| One-way | Write-only | String | Identifier of the module in the system to use e.g. Display
`index`| One-way | Write-only | Number | Index of the module in the system. Default: 1
`enable`| One-way | Write-only | String | Enables debugging. Output will not update if `false`

## Services

### System Service

The systems service performs all the interactions on bindings.

Authentication details are setup through this service.

### Resources Service

The resources service is used to make accessing Control API simple.

## License

MIT © [Alex Sorafumo](alex@yuion.net)
