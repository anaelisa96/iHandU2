//CHART AREA
let secondsToShow=6;
let fs=12; //a minha fs devia ser 50hz Mmas se ponho aqui 50 fica muito lento
let xlabel=[];

let TimeStart=Date.now();
let TimeEnd=Date.now();

(arr = []).length = secondsToShow*fs-1; arr.fill(0); //Isto resulta num array de tamanho 35 com zeros right?
(arr1 = []).length = secondsToShow*fs-1; arr1.fill(0);
(arr2 = []).length = secondsToShow*fs-1; arr2.fill(0);

(arr3 = []).length = secondsToShow*fs-1; arr3.fill(0);
(arr4 = []).length = secondsToShow*fs-1; arr4.fill(0);
(arr5 = []).length = secondsToShow*fs-1; arr5.fill(0);

(arr6 = []).length = secondsToShow*fs-1; arr6.fill(0);
(arr7 = []).length = secondsToShow*fs-1; arr7.fill(0);
(arr8 = []).length = secondsToShow*fs-1; arr8.fill(0);

/*
console.log('arr = ' + arr)
console.log('arr1 = ' + arr1)
console.log('arr2 = ' + arr2)
*/

j=0
for (i = 0; i < secondsToShow*fs-1; i++){
  if (i%35==0){ //perguntar o porquê do 249, com fs=8 deveria ser 79 (tamanho de arr[]) right?
    xlabel.push(j.toString()) 
    j+=1
  }
  else{
    xlabel.push("")
  }
}
console.log('xlabel = ' + xlabel) //xlabel é um array com os índices das novas amostras??


var ctx = document.getElementById('accChart').getContext('2d'); //criar gráfico 2D? Necessário para trabalhar com o gráfico maybe
var myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: xlabel,
    datasets: [{ 
        label: 'x axis',
        data: arr,
        borderColor: "#3e95cd",
        fill: false,
      },
      {
        label: 'y axis',
        data:arr1,
        borderColor: "#ef0d09",
        fill: false
      },
      {
        label: 'z axis',
        data:arr2,
        borderColor: "#167a09",
        fill: false
      }
    ]
  },
  options: {
    title: {
      display: true,
      text: 'Accelerometer'
    },
    elements: {
      point:{
          radius: 0
      }
    },
    scales: {
      xAxes: [{
          gridLines: {
              display:false
          }
      }],
      yAxes: [{
          gridLines: {
              display:false
          },
          ticks: {
            min: -2,    // minimum will be 0, unless there is a lower value.
            // OR //
            max: 2   // minimum value will be 0.
          }
      }]
    }
  }
});

var cgyrox = document.getElementById('gyroChart').getContext('2d');
var myGyroChart = new Chart(cgyrox, {
  type: 'line',
  data: {
    labels: xlabel,
    datasets: [{ 
        label: 'x axis',
        data: arr3, //arr,
        borderColor: "#3e95cd",
        fill: false,
      },
      {
        label: 'y axis',
        data: arr4, //arr1,
        borderColor: "#ef0d09",
        fill: false
      },
      {
        label: 'z axis',
        data: arr5, //arr2,
        borderColor: "#167a09",
        fill: false
      }
    ]
  },
  options: {
    title: {
      display: true,
      text: 'Gyroscope'
    },
    elements: {
      point:{
          radius: 0
      }
    },
    scales: {
      xAxes: [{
          gridLines: {
              display:false
          }
      }],
      yAxes: [{
          gridLines: {
              display:false
          },
          ticks: {
            min: -500,    // minimum will be 0, unless there is a lower value.
            // OR //
            max: 500   // minimum value will be 0.
          }
      }]
    }
  }
});

var cmagx = document.getElementById('magChart').getContext('2d');
var myMagChart = new Chart(cmagx, {
  type: 'line',
  data: {
    labels: xlabel,
    datasets: [{ 
        label: 'x axis',
        data: arr6, //arr,
        borderColor: "#3e95cd",
        fill: false,
      },
      {
        label: 'y axis',
        data: arr7, //arr1,
        borderColor: "#ef0d09",
        fill: false
      },
      {
        label: 'z axis',
        data: arr8, //arr2,
        borderColor: "#167a09",
        fill: false
      }
    ]
  },
  options: {
    title: {
      display: true,
      text: 'Magnetometer'
    },
    elements: {
      point:{
          radius: 0
      }
    },
    scales: {
      xAxes: [{
          gridLines: {
              display:false
          }
      }],
      yAxes: [{
          gridLines: {
              display:false
          },
          ticks: {
            min: -5000,    // minimum will be 0, unless there is a lower value.
            // OR //
            max: 5000   // minimum value will be 0.
          }
      }]
    }
  }
});

//CONNECTION PART DOWN fROM HERE

// Get references to UI elements
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');


// Connect to the device on Connect button click
connectButton.addEventListener('click', function() {
  connect();
});

// Disconnect from the device on Disconnect button click
disconnectButton.addEventListener('click', function() {
  disconnect();
});

// Handle form submit event
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Prevent form sending
  send(inputField.value); // Send text field contents
  inputField.value = '';  // Zero text field
  inputField.focus();     // Focus on text field
});

let deviceCache = null;


function requestBluetoothDevice() {
  log('Requesting bluetooth device...');

  return navigator.bluetooth.requestDevice({
    filters: [{services: ['1a9a5e03-d184-4f89-bb23-e7861b06cd4f']}],
  }).
      then(device => {
        log('"' + device.name + '" bluetooth device selected');
        deviceCache = device;

        //Handle Disconnection
        deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

        return deviceCache;
      });
}

// Handle Disconnection function
function handleDisconnection(event) {
  let device = event.target;

  log('"' + device.name +
      '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
      then(characteristic => startNotifications(characteristic)).
      catch(error => log(error));
}


// Connect to the device specified, get service and characteristic

let characteristicCache = null;

function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  log('Connecting to GATT server...');

  return device.gatt.connect().
      then(server => {
        log('GATT server connected, getting service...');

        return server.getPrimaryService('1a9a5e03-d184-4f89-bb23-e7861b06cd4f');
      }).
      then(service => {
        log('Service found, getting characteristic...');

        return service.getCharacteristic('8621b83d-e1fd-46b0-b064-29d80a2c2b6d');
      }).
      then(characteristic => {
        log('Characteristic found');
        //console.log(characteristic)
        characteristicCache = characteristic;

        return characteristicCache;
      }).
      then(characteristic => {
        //console.log(characteristic)
        startNotificationsAcc(characteristic)}); //[1])
      //  return characteristic[2];
      //}).then(characteristic=> {
      //  console.log(characteristic)
      //  startNotificationsGyro(characteristic)
      //});
}



// Enable the characteristic changes notification
function startNotificationsAcc(characteristic) {
  log('Starting notifications ACC...');

  return characteristic.startNotifications().
      then(() => {
        log('Notifications started');

        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });
}

//function startNotificationsGyro(characteristic){
//  log('Starting notifications ACC...');

//  return characteristic.startNotifications().
//      then(() => {
//        log('Notifications started');

//        characteristic.addEventListener('characteristicvaluechanged',
//            handleCharacteristicValueChangedGyro);
//      });
//}
var hasStarted=false;
var samples=0
function handleCharacteristicValueChanged(event) {
  if (!hasStarted){
    console.log("STARTED")
    TimeStart=Date.now()
    hasStarted=true
  }

  let value = event.target.value;
  console.log(value)
  for (var i = 0 ; i < 4 ; i++){

    x=value.getFloat32(0 + 12*i,true)
    console.log('x = '+ x)
    myLineChart.data.datasets[0].data.shift()
    myLineChart.data.datasets[0].data.push(x)

    y=value.getFloat32(4 + 12*i,true)
    console.log('y = ' + y)
    myLineChart.data.datasets[1].data.shift()
    myLineChart.data.datasets[1].data.push(y)

    z=value.getFloat32(8 + 12*i,true)
    console.log('z = ' + z)
    myLineChart.data.datasets[2].data.shift()
    myLineChart.data.datasets[2].data.push(z)
    myLineChart.update()

    xg=value.getFloat32(48 + 12*i,true)
    console.log('xg = ' + xg)
    myGyroChart.data.datasets[0].data.shift()
    myGyroChart.data.datasets[0].data.push(xg)

    yg=value.getFloat32(52 + 12*i,true)
    console.log('yg = ' + yg)
    myGyroChart.data.datasets[1].data.shift()
    myGyroChart.data.datasets[1].data.push(yg)

    zg=value.getFloat32(56 + 12*i,true)
    console.log('zg = ' + zg)
    myGyroChart.data.datasets[2].data.shift()
    myGyroChart.data.datasets[2].data.push(zg)
    myGyroChart.update()

    xm=value.getFloat32(96 + 12*i,true)
    console.log('xm = ' + xm)
    myMagChart.data.datasets[0].data.shift()
    myMagChart.data.datasets[0].data.push(xm)

    ym=value.getFloat32(100 + 12*i,true)
    console.log('ym = ' + ym)
    myMagChart.data.datasets[1].data.shift()
    myMagChart.data.datasets[1].data.push(ym)

    zm=value.getFloat32(104 + 12*i,true)
    console.log('zm = ' + zm)
    myMagChart.data.datasets[2].data.shift()
    myMagChart.data.datasets[2].data.push(zm)
    myMagChart.update()

  }
  
  samples+=1;
  // Convert raw data bytes to hex values just for the sake of showing something.
  // In the "real" world, you'd use data.getUint8, data.getUint16 or even
  // TextDecoder to process raw data bytes.
/*   let tmp = '';
  let j=0
  for (let i = 0; i < value.byteLength; i++) {
    j+=1
    tmp+=('00' + value.getUint8(i).toString(16)).slice(-2);
    if (j==3){
      //a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
      a.push(parseInt(tmp,16))
      tmp=''
      j=0
    }
  } */
/*   log(a, 'in');
  arr = arr.slice(33, arr.length);
  arr.push(...a)
  myLineChart.data.datasets[0].data=myLineChart.data.datasets[0].data.slice(33, arr.length);
  myLineChart.data.datasets[0].data.push(...a)
  myLineChart.update()
  console.log(myLineChart.data.datasets) */
  //console.log(myLineChart.datasets[0].data)
  
  //console.log("cenas")
  //console.log(a)
  //log(event.target.value)
}
/*
function handleCharacteristicValueChangedGyro(event) {

  console.log("LMAO")
  console.log(event.target)

  let value = event.target.value;
  console.log(value)
  x=value.getFloat32(0,true)
  console.log(x)
  myGyroChart.data.datasets[0].data.shift()
  myGyroChart.data.datasets[0].data.push(x)

  y=value.getFloat32(4,true)
  console.log(y)
  myGyroChart.data.datasets[1].data.shift()
  myGyroChart.data.datasets[1].data.push(y)

  z=value.getFloat32(8,true)
  console.log(z)
  myGyroChart.data.datasets[2].data.shift()
  myGyroChart.data.datasets[2].data.push(z)
  myGyroChart.update()
}
*/
// Output to terminal
function log(data, type = '') {
  terminalContainer.insertAdjacentHTML('beforeend',
  '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
}

// Launch Bluetooth device chooser and connect to the selected
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
    requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    catch(error => log(error));
}

// Disconnect from the connected device
function disconnect() {
  //
  TimeEnd=Date.now()
  console.log(samples)
  console.log(TimeEnd-TimeStart)
  console.log(samples/(TimeEnd-TimeStart))
  if (deviceCache) {
    log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
        handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
      log('"' + deviceCache.name +
          '" bluetooth device is already disconnected');
    }

    if (characteristicCache) {
      characteristicCache.removeEventListener('characteristicvaluechanged',
          handleCharacteristicValueChanged);
      characteristicCache = null;
    }
  
    deviceCache = null;
  }

  characteristicCache = null;
  deviceCache = null;
}

// Send data to the connected device
function send(data) {
  //
}
