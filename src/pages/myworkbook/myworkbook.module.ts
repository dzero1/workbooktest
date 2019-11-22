import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MyworkbookComponent } from './myworkbook';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  declarations: [
    MyworkbookComponent
  ],
  imports: [
    ColorPickerModule,
    IonicPageModule.forChild(MyworkbookComponent),
  ],
})
export class MyworkbookModule {}
