let systemData = {
    'sys-B0' : {
       System: [{
           $power_on: function () {
               this.$$['Display'][0].$power(true);
               this.$$['Display'][1].$power(true);
               this.$$['Display'][0].$switch_to('vga');

               this.state = 'on';
           },
           $power_off: function () {
               this.$$['Display'][0].$switch_to('hdmi');
               this.$$['Display'][0].$power(false);
               this.$$['Display'][1].$power(false);

               this.state = 'off';
           },
           state: 'off'
       }],

       // Display_1 and Display_2
       Display: [{
           power: false,
           $power: function (state) {
               this.power = !!state;
           },
           input: 'hdmi',
           $switch_to: function (input) {
               this.input = input;
           }
       }, {
           power: false,
           $power: function (state) {
               this.power = !!state;
           },
           input: 'hdmi',
           $switch_to: function (input) {
               this.input = input;
           }
       }]
    }
}

window['systemData'] = systemData;
