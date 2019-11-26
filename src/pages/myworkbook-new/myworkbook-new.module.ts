import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MyworkbookNewPage } from './myworkbook-new';

@NgModule({
  declarations: [
    MyworkbookNewPage,
  ],
  imports: [
    IonicPageModule.forChild(MyworkbookNewPage),
  ],
})
export class MyworkbookNewPageModule {}
