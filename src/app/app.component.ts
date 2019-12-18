import { Component, ViewChild } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { MyworkbookNewPage } from '../pages/myworkbook-new/myworkbook-new';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  //rootPage:any = MyworkbookNewPage;
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

      let str = location.href.toString().split("?")[1].substr(2);
      
      this.nav.setRoot(MyworkbookNewPage, { a: str});
    });
  }
}

