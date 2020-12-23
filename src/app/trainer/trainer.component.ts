/// <reference types="web-bluetooth" />
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.component.html',
  styleUrls: ['./trainer.component.scss'],
})
export class TrainerComponent implements OnInit {
  lastWheelRevolutionCount = 0;
  lastWheelRevolutionEvent = 0;
  lastCrankRevolutionCount = 0;
  lastCrankRevolutionEvent = 0;
  lastCscMeasurementTime = 0;
  currentSpeed = 0;

  isConnectDisabled = false;
  connectButtonText = 'Connect to trainer';

  constructor() {}

  ngOnInit(): void {}

  onConnectClick(): void {
    if (!this.isConnectDisabled) {
      this.isConnectDisabled = true;
      navigator.bluetooth
        .requestDevice({ filters: [{ services: [0x1816] }] })
        .then((device: BluetoothDevice) => {
          this.connectButtonText = 'Waiting';
          return device.gatt.connect();
        })
        .then((server: BluetoothRemoteGATTServer) => {
          this.connectButtonText = 'Connected';
          return server.getPrimaryService(0x1816);
        })
        .then((service: BluetoothRemoteGATTService) => {
          return service.getCharacteristic(0x2a5b);
        })
        .then((characteristic: BluetoothRemoteGATTCharacteristic) => {
          return characteristic.startNotifications();
        })
        .then((characteristic: BluetoothRemoteGATTCharacteristic) => {
          characteristic.addEventListener(
            'characteristicvaluechanged',
            (ev: Event): any => {
              this.onSpeedChange(ev);
            }
          );
          this.connectButtonText = 'Connected. Listing to data.';
        });
    }
  }

  public onSpeedChange(ev: Event) {
    const dv: DataView = (ev.target as any).value;
    const flags = dv.getUint8(0);
    // tslint:disable-next-line:no-bitwise
    const hasWr = (flags & 0x01) === 0x01;
    // tslint:disable-next-line:no-bitwise
    const hasCr = (flags & 0x02) === 0x02;

    const cwr = hasWr ? dv.getUint32(1, true) : 0;
    const lwet = hasWr ? dv.getUint16(5, true) : 0;
    const ccr = hasCr ? dv.getUint16(7, true) : 0;
    const lcet = hasCr ? dv.getUint16(9, true) : 0;

    if (hasWr) {
      let delta;
      if (this.lastWheelRevolutionEvent >= lwet) {
        delta = 65536 - lwet + this.lastWheelRevolutionEvent;
      } else {
        delta = lwet - this.lastWheelRevolutionEvent;
      }

      const wheelCirc = 2096;
      const speed =
        ((((cwr - this.lastWheelRevolutionCount) * wheelCirc) /
          (delta / 1.024)) *
          60 *
          60) /
        1000;

      this.currentSpeed = speed * 3.6;
      this.lastWheelRevolutionCount = cwr;
      this.lastWheelRevolutionEvent = lwet;
    }

    this.lastCscMeasurementTime = new Date().valueOf();

    console.log(hasWr, hasCr, cwr, lwet, ccr, lcet);
  }
}
