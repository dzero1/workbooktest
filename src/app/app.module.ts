import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { MyworkbookComponent } from '../pages/myworkbook/myworkbook';
import { WebRequestProvider } from '../providers/web-request';
import { AlertServiceProvider } from '../providers/alert-service';
import { ColorPickerModule } from 'ngx-color-picker';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    MyApp,
    MyworkbookComponent
  ],
  imports: [
    BrowserModule,
    ColorPickerModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp, {}, {
      links: [
       { component: MyworkbookComponent, name: 'Workbook', segment: 'workbook' },
       { component: MyworkbookComponent, name: 'Workbook', segment: 'workbook/:book' },
       { component: MyworkbookComponent, name: 'Workbook', segment: 'workbook/:book/:page' },
       { component: MyworkbookComponent, name: 'Workbook', segment: 'workbook/:book/:page/:user' }
     ]
   })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    MyworkbookComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    WebRequestProvider,
    AlertServiceProvider,
  ]
})
export class AppModule {}
