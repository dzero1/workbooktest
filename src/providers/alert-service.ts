import { Injectable, Sanitizer } from '@angular/core';
import { ToastController, AlertController, Alert, LoadingController, ModalController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';

/*
  Generated class for the AlertServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AlertServiceProvider {

  private static toastCtrl:ToastController;
  private static alertCtrl:AlertController;
  private static loadingCtrl:LoadingController;
  private static modalCtrl:ModalController;
  private static sanitizer:DomSanitizer;

  constructor(
    private _toastCtrl: ToastController,
    private _alertCtrl: AlertController,
    private _loadingCtrl: LoadingController, 
    private _modalCtrl: ModalController, 
    private _sanitizer: DomSanitizer, 
  ) {
    //console.log('Hello AlertServiceProvider Provider');
    AlertServiceProvider.toastCtrl = _toastCtrl;
    AlertServiceProvider.alertCtrl = _alertCtrl;
    AlertServiceProvider.loadingCtrl = _loadingCtrl;
    AlertServiceProvider.modalCtrl = _modalCtrl;
    AlertServiceProvider.sanitizer = _sanitizer;
  }

  static Toast(msg:string, timeout:number = 3000, position:string = 'top', onDidDismiss = null) {
    let toast = AlertServiceProvider.toastCtrl.create({
      message: msg,
      duration: timeout,
      position: position
    });
  
    toast.onDidDismiss(() => {
      if (onDidDismiss) onDidDismiss();
      //console.log('Dismissed toast');
    });
  
    toast.present();
    return toast;
  }

  static Alert(message, title = '', icon:AlertIcons = AlertIcons.Info, alertButtonType:AlertButtons = AlertButtons.OK, returnHandler:Function=null){
    const _title:any = AlertServiceProvider.sanitizer.bypassSecurityTrustHtml( AlertServiceProvider.parseAlertIcon(icon) + title)
    let defaultSettings = {
      title: _title,
      subTitle: message,
      buttons: []
    };

    const btn_ok = {
      text: 'OK',
      role: 'ok',
      handler: () => {
        if (returnHandler !== null) returnHandler(AlertButtons.OK);
      }
    };
    const btn_yes = {
      text: 'YES',
      role: 'yes',
      handler: () => {
        if (returnHandler !== null) returnHandler(AlertButtons.Yes);
      }
    };
    const btn_no = {
      text: 'NO',
      role: 'no',
      handler: () => {
        if (returnHandler !== null) returnHandler(AlertButtons.No);
      }
    };
    const btn_cancel = {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        if (returnHandler !== null) returnHandler(AlertButtons.Cancel);
      }
    };
    
    let buttons: Array<any> = [];
    switch (alertButtonType) {
      case AlertButtons.Yes:
        buttons.push(btn_yes);
        break;
      case AlertButtons.No:
        buttons.push(btn_no);
        break;
      case AlertButtons.Cancel:
        buttons.push(btn_cancel);
        break;
      case AlertButtons.YesNo:
        buttons.push(btn_yes);
        buttons.push(btn_no);
        break;
      case AlertButtons.YesNoCancel:
        buttons.push(btn_yes);
        buttons.push(btn_no);
        buttons.push(btn_cancel);
        break;
      case AlertButtons.YesCancel:
        buttons.push(btn_yes);
        buttons.push(btn_cancel);
        break;
      case AlertButtons.OKCancel:
        buttons.push(btn_ok);
        buttons.push(btn_cancel);
        break;
      case AlertButtons.OK:
      default:
        buttons.push(btn_ok);
        break;
    }

    defaultSettings.buttons = buttons;

    let alert:Alert = AlertServiceProvider.alertCtrl.create(defaultSettings);
    alert.present();
    return alert;
  }

  private static parseAlertIcon(icon:AlertIcons):string{
    let ret:string = '';
    switch (icon) {
      case AlertIcons.Alert:
        ret = '<ion-icon item-left="" role="img" class="icon icon-md ion-md-ios-hand item-icon" style="color: orange;" aria-label="ios-hand" ng-reflect-name="ios-hand"></ion-icon> ';
        break;
      case AlertIcons.Info:
        ret = '<ion-icon item-left="" role="img" class="icon icon-md ion-md-alert item-icon" style="color: cornflowerblue;" aria-label="alert" ng-reflect-name="alert"></ion-icon> ';
        break;
      case AlertIcons.Question:
        ret = '<ion-icon item-left="" role="img" class="icon icon-md ion-md-help-circle item-icon" style="color: cornflowerblue;" aria-label="help-circle" ng-reflect-name="help-circle"></ion-icon> ';
        break;
      case AlertIcons.Critical:
      case AlertIcons.Error:
        ret = '<ion-icon item-left="" role="img" class="icon icon-md ion-md-close-circle item-icon" style="color: crimson;" aria-label="close-circle" ng-reflect-name="close-circle"></ion-icon> ';
        break;
      default:
        ret = '<ion-icon item-left="" role="img" class="icon icon-md ion-md-alert item-icon" style="color: orange;" aria-label="alert" ng-reflect-name="alert"></ion-icon> ';
        break;
    }

    return ret;
  }

  static Loader(message = '', spinner='crescent'){
    const loading = this.loadingCtrl.create({
      spinner: spinner,
      content: message
    });
    loading.present();
    return loading;
  }

  static Prompt(message, title = '', inputs=[], ok_button_name='OK', okHandler=null, cancel_button_name='Cancel', cancelHandler=null) {
    let params = {
      title: title,
      message: message,
      inputs: inputs,
      enableBackdropDismiss: false,
      buttons: [
        {
          text: ok_button_name,
          cssClass:'secondary',
          handler: okHandler ? okHandler : ()=>{}
        },
        {
          text: cancel_button_name,
          role: 'cancel',
          handler: cancelHandler ? cancelHandler : data => {
            //console.log('Cancel clicked');
          }
        }
      ],
    };

    let alert = this.alertCtrl.create(params);
    alert.present();
    return alert;
  }

  static Modal(controller, params = {}, enableBackdropDismiss=true, cssClass = ''){
    let modal = this.modalCtrl.create(controller, params, {showBackdrop:true, cssClass:cssClass, enableBackdropDismiss:enableBackdropDismiss});
    modal.present();
    return modal;
  }
}


export enum AlertIcons {
  Info      = 'info',
  Alert     = 'alert',
  Critical  = 'critical',
  Error     = 'error',
  Question  = 'question',
}

export enum AlertButtons {
  OK            = 'OK',
  Cancel        = 'Cancel',
  OKCancel      = 'OKCancel',
  Yes           = 'Yes',
  No            = 'No',
  YesNo         = 'YesNo',
  YesNoCancel   = 'YesNoCancel',
  YesCancel     = 'YesCancel',
}
