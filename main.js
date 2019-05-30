//CHART AREA
let secondsToShow=10;
let fs=250;
let xlabel=[];
(arr = []).length = secondsToShow*fs-1; arr.fill(0);
console.log(arr)

j=0
for (i = 0; i < secondsToShow*fs-1; i++){
  if (i%249==0){
    xlabel.push(j.toString())
    j+=1
  }
  else{
    xlabel.push("")
  }
}
console.log(xlabel)


var ctx = document.getElementById('myChart').getContext('2d');
var myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: xlabel,
    datasets: [{ 
        data: arr,
        borderColor: "#3e95cd",
        fill: false,
      }
    ]
  },
  options: {
    title: {
      display: true,
      text: 'ECG'
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
    filters: [{services: ['d0eb25b2-2c58-4044-aa07-a81cf785b676']}],
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

        return server.getPrimaryService('d0eb25b2-2c58-4044-aa07-a81cf785b676');
      }).
      then(service => {
        log('Service found, getting characteristic...');

        return service.getCharacteristic('82901d4a-edb2-4289-94ef-d3974c59347b');
      }).
      then(characteristic => {
        log('Characteristic found');
        characteristicCache = characteristic;

        return characteristicCache;
      });
}



// Enable the characteristic changes notification
function startNotifications(characteristic) {
  log('Starting notifications...');

  return characteristic.startNotifications().
      then(() => {
        log('Notifications started');

        characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
      });
}

function handleCharacteristicValueChanged(event) {
  let value = event.target.value;
  let a = [];
  // Convert raw data bytes to hex values just for the sake of showing something.
  // In the "real" world, you'd use data.getUint8, data.getUint16 or even
  // TextDecoder to process raw data bytes.
  let tmp = '';
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
  }
  log(a, 'in');
  arr = arr.slice(33, arr.length);
  arr.push(...a)
  myLineChart.data.datasets[0].data=myLineChart.data.datasets[0].data.slice(33, arr.length);
  myLineChart.data.datasets[0].data.push(...a)
  myLineChart.update()
  console.log(myLineChart.data.datasets)
  //console.log(myLineChart.datasets[0].data)
  
  //console.log("cenas")
  //console.log(a)
  //log(event.target.value)
}

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
    then(characteristic => startNotifications(characteristic)).
    catch(error => log(error));
}

// Disconnect from the connected device
function disconnect() {
  //
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