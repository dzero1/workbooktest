import { Component, ViewChild } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { MyworkbookComponent } from '../pages/myworkbook/myworkbook';
import { Route } from '@angular/compiler/src/core';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = MyworkbookComponent;
  @ViewChild(Nav) nav: Nav;

  constructor(
    platform: Platform, 
    statusBar: StatusBar, 
    splashScreen: SplashScreen) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      
      this.nav.setRoot(MyworkbookComponent);
    });
  }
}

