import { Component, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { NavController, NavParams, LoadingController, Platform, IonicPage } from 'ionic-angular';
import { WebRequestProvider } from '../../providers/web-request';
import { AlertServiceProvider } from '../../providers/alert-service';
//import { UserServiceProvider } from '../../providers/user-service';
import { Gesture } from 'ionic-angular/gestures/gesture';

import { fabric } from 'fabric';

const SCALE_FACTOR = 1.1;
const STATE_IDLE = 'idle';
const STATE_PANNING = 'panning';

const PAGE_EXTEND_HEIGHT = 100;

/**
 * Generated class for the PagesMyworkbookComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
// @IonicPage()
@Component({
  selector: 'page-workbook',
  templateUrl: 'myworkbook.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyworkbookComponent {
  bookid:number;
  courseid:number;
  selectedTab:any;
  pages:Array<any> = [];
  currentPage:number = 0;
  pageLoaded:boolean = false;
  onInit:boolean = true;
  onSaving:Boolean = false;
  mode = 'notebook';

  canvas:any;
  text:any;
  addText: boolean;
  h:Array<any> =[];
  isRedoing = false;
  color = '#000000';
  brushWidth = 1;
  brushImage = 1;
  brushWidthDiv = false;
  EditedPagesArray:Array<any> = [];
  editingMode = 'draw';
  selectedObject:any;
  user:any;
  state;
  canvasImage;

  input = {dragStartX:0, dragStartY:0, dragX:0, dragY:0, dragDX:0, dragDY:0, dragging:false};
  posX = 0;
  posY = 0;
  velocityX = 0;
  velocityY = 0;
  containerWidth= 1000;
  containerHeight= 600;
  platformHeight;
  platformWidth;
  container;
  plateContainer;
  c;
  cdrDetach: boolean;
  idletimer;
  tool = 'pen';
  savetimer;
  loading;

  tapGesture: Gesture;
  pinchGesture: Gesture;
  lastscale;
  objectsarray:number = 0;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private cdr: ChangeDetectorRef,
    public loadingCtrl: LoadingController,
    public webReq: WebRequestProvider,
    //private userService: UserServiceProvider,
    platform: Platform,
  ) {
    this.user = 1833;
    //this.user = UserServiceProvider.USER;
    //if (navParams.get('mode') !== undefined) {
      /* this.pages = navParams.get('pages');
      this.mode = navParams.get('mode');
      this.courseid = navParams.get('courseid'); */
      this.webReq.request('local_app_get_workbook_data',  {workbookid: 11, userid:this.user })
      .then(res=>{
        this.pages = res;
        this.canvasInit();
        //this.cdr.detectChanges();
      }).catch((error)=>{
        console.log(error)
      });
      
      this.mode = 'workbook';
      this.courseid = 107;
    //}
    
    platform.ready().then((readySource) => {
      this.platformHeight = platform.height();
      this.platformWidth = platform.width();
    });

    this.loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    this.loading.present();
  }
  
  ngOnInit() {
    this.container= document.getElementById('exampleContainer1');
		this.plateContainer = document.getElementById('plateContainer');
    this.c = document.getElementById('canvasId');
    
    this.pinchGesture = new Gesture(this.plateContainer);
		this.pinchGesture.listen();
		this.pinchGesture.on('pinch', ev => {
      let zoom = (this.lastscale < ev.scale)?'in':'out';
			if(this.tool === 'pan' ) {;
        if(zoom === 'in') {
          this.zoomIn();
        } else {
          this.zoomOut();
        }
      }
      this.lastscale = ev.scale;
      this.cdr.detectChanges();
    });

    this.tapGesture = new Gesture(this.plateContainer);
		this.tapGesture.listen();
    this.tapGesture.on('tap', ev => {
      if(this.addText) {
        const pointx = ev.srcEvent.offsetX;
        const pointy = ev.srcEvent.offsetY;
        this.write(pointx, pointy);
      }
    });
    this.onAnimationFrame();
  }
  
  ionViewDidLoad() {
    /* if( this.mode !== 'workbook') {
    } */
  }
  
  setPixels(i) {
    if( this.pages[i].url !== '' ) {
      let image = document.getElementById('page'+ i) as HTMLImageElement;
      this.pages[i].width = image.naturalWidth;
      this.pages[i].height = image.naturalHeight;
    }
    if(i == 0) {
      this.canvasInit();
    }
  }
  
  alreadyInit:boolean = false;
  canvasInit() {
    if (this.alreadyInit) {
      return;
    }
    this.alreadyInit = true;
    this.canvas = new fabric.Canvas('canvasId', { renderOnAddRemove: false });
    this.state = STATE_IDLE;
    this.canvas.isDrawingMode = true;
    fabric.Object.prototype.selectable = false;
    this.canvas.freeDrawingBrush.width = this.brushWidth;
    this.canvas.freeDrawingBrush.color = this.color;
    this.canvas.toggleDragMode = function(dragMode) { 
      if (dragMode) {
        // Set the cursor to 'move'
        this.defaultCursor = 'move';
        // Discard any active object
        this.discardActiveObject();
        // Loop over all objects and disable events / selectable.
        this.forEachObject(function(object) {
          object.prevEvented = object.evented;
          object.prevSelectable = object.selectable;
          object.evented = false;
          object.selectable = false;
        });
        // Remove selection ability on the canvas
        this.selection = false;
      } else {
        this.defaultCursor = 'default';
        // When we exit dragmode, we restore the previous values on all objects
        this.forEachObject(function(object) {
          object.evented = (object.prevEvented !== undefined) ? object.prevEvented : object.evented;
          object.selectable = (object.prevSelectable !== undefined) ? object.prevSelectable : object.selectable;
        });
        // Restore selection ability on the canvas
        // this.selection = true;
      }
    }

    this.canvas.on('path:created', () => {
      this.objectsarray += 1;
    });

    this.canvas.on('object:added', () => {
      if(!this.isRedoing){
        this.h = [];
      }
      this.isRedoing = false;
      if(this.canvas.getObjects().length > 1 && !this.cdrDetach) {
        this.cdrDetach = true;
        this.cdr.detach();
      }
    });

    this.canvas.on({
      'mouse:down': (e) => {
        this.cdr.detectChanges();
      },
      'mouse:move': (e) => {
        //this.canvas.renderAll();
      },
      'mouse:up': (e) => {
        if (this.tool == 'erase' || this.tool == 'pen') this.renderZoom()
      },
      'mouse:out': (e) => {
        if (this.tool == 'erase' || this.tool == 'pen') this.cdr.detectChanges();
      }
    });
    
    if(this.pages.length > 0 && this.pages[0].width) {
      let width = (this.pages[0].width)? (this.pages[0].width) : 1000;
      let height = (this.pages[0].height)? (this.pages[0].height) : 500;
      if(this.pages[0].extend !== null) {
        let extendedHeight = JSON.parse(this.pages[0].extend);
        let ext = (extendedHeight && extendedHeight.height)? extendedHeight.height: 0;
        
        height = this.pages[0].height + ext;
        width = this.pages[0].width;
      }
      this.canvas.setDimensions({width:width, height:height});
      this.canvasImage = this.pages[0].url;
      if(this.pages[0].data !== '') {
        this.canvas.loadFromJSON(this.pages[0].data, this.canvas.renderAll.bind(this.canvas));
      } else {
        this.canvas.setBackgroundImage(this.pages[0].url, this.canvas.renderAll.bind(this.canvas));
      }
      this.generateImage();
    }
   
    //this.idletimer = setInterval(() => { 
    //   if(this.cdrDetach) {
    //  this.cdr.detectChanges();
    //   }
    //}, 1000);
    this.loading.dismiss();
    //this.cdr.detectChanges();
  }

  setCanvas(index, page) {
    this.resetZoom();
    this.draw();
    this.h = [];
    if(this.currentPage !== undefined && this.objectsarray > 0 ) {
      // this.generateImage();
      this.pages[this.currentPage].userid = this.user.id;
      this.pages[this.currentPage].data = JSON.stringify(this.canvas);
      //this.saveData(this.currentPage);
    }
    this.canvas.clear();
    this.objectsarray = 0;
    this.currentPage = index;
    let width = (this.pages[index].width)? (this.pages[index].width) : 1000;
    let height = (this.pages[index].height)? (this.pages[index].height) : 500;
    if(this.pages[index].extend !== null) {
      let extendedHeight = JSON.parse(this.pages[index].extend);
      let ext = (extendedHeight && extendedHeight.height)? extendedHeight.height: 0;
      
      height = this.pages[index].height + ext;
      width = this.pages[index].width;
    }
    this.canvas.setDimensions({width:width, height:height});
    if(this.pages[index].data !== '') {
      this.canvas.loadFromJSON(this.pages[index].data, ()=>{
        this.canvas.renderAll.bind(this.canvas);
        this.cdr.detectChanges();
      });
      this.generateImage();
      this.cdr.detectChanges();
    } else {
      this.canvas.setBackgroundImage(this.pages[index].url, ()=>{
        this.canvas.renderAll.bind(this.canvas);
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    }
    this.canvasImage = page.url;
    this.cdr.detectChanges();
  }

  async generateImage() {
    // convert it into a dataURL, then back to a fabric image
    const newData = this.canvas.toDataURL({
      withoutTransform: true,
      quality: 1
    });

    const objects = this.canvas.getObjects();
    this.canvas.remove(...objects);
    this.canvas.clear();
    await fabric.Image.fromURL(newData, (fabricImage) => {
      // remove the old objects then add the new image
      this.canvas.add(fabricImage);
    });
  }

  extendPage(index, type) {
    let extendedHeight = JSON.parse(this.pages[index].extend);
    let ext = (extendedHeight && extendedHeight.height)? extendedHeight.height: 0;
    
    let height = this.pages[index].height;
    let width = this.pages[index].width;
    if(type === 'new') {
      if (!extendedHeight) extendedHeight = {height : ext};
      extendedHeight.height = ext + PAGE_EXTEND_HEIGHT;
      height = this.pages[index].height + extendedHeight.height;
      this.pages[index].extend = JSON.stringify(extendedHeight);
    }
    this.canvas.setDimensions({width:width, height:height});
    this.cdr.detectChanges();
  }

  removeExtendPage() {
    let extendedHeight = JSON.parse(this.pages[this.currentPage].extend);
    if(extendedHeight && extendedHeight.height && extendedHeight.height > 0) {
      extendedHeight.height =  extendedHeight.height - PAGE_EXTEND_HEIGHT;
      this.pages[this.currentPage].extend = JSON.stringify(extendedHeight);
      let height =  this.pages[this.currentPage].height + extendedHeight.height;
      let width = this.pages[this.currentPage].width;
      this.canvas.setDimensions({width:width, height:height});
    } else {
      this.pages[this.currentPage].extend = null;
    }
    this.cdr.detectChanges();
  }

  pan() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    this.cdr.detectChanges();
  }

  onAnimationFrame() {
    if(this.input.dragDX !== 0) this.velocityX = this.input.dragDX;
    if(this.input.dragDY !== 0) this.velocityY = this.input.dragDY;
    
    this.posX+= this.velocityX;
    this.posY+= this.velocityY;

    //restict horizontally
    if(this.posX< (-this.plateContainer.clientWidth + 500)) this.posX=(-this.plateContainer.clientWidth + 500);
    else if(this.posX>(this.plateContainer.clientWidth + 50)) this.posX=(this.plateContainer.clientWidth + 50);

    //restict vertically
    if(this.posY< (-this.plateContainer.clientHeight + 100) ) this.posY= (-this.plateContainer.clientHeight + 100);
    else if(this.posY> (this.platformHeight - 200)) this.posY= (this.platformHeight - 200);

    //set the transform
    this.plateContainer.style['transform']= 'translate('+this.posX+'px,'+this.posY+'px) translateZ(0)';

    this.velocityX= this.velocityX*0.4;
    this.velocityY= this.velocityY*0.4;

    this.input.dragDX=0;
    this.input.dragDY=0;
  }

  onPlateMouseDown(event) { ///////////
    event.preventDefault();
    if(this.state === STATE_PANNING && this.c.clientHeight > this.platformHeight ){
    document.addEventListener('mouseup', (e) => {
      this.onDocumentMouseUp(e, this.input)});
    document.addEventListener('mousemove', (e) => {
      this.onDocumentMouseMove(e, this.input)});
    this.handleDragStart(event.clientX, event.clientY);
    }
  }

  onDocumentMouseMove(event, input) { ////////////
    if(input.dragging && this.state === STATE_PANNING) this.handleDragging(event.clientX, event.clientY);
  }

  onDocumentMouseUp(event, input) { ////////////
    if(this.state === STATE_PANNING){
    document.removeEventListener('mouseup', (e) => {
      this.onDocumentMouseUp(e, input)});
    document.removeEventListener('mousemove', (e) => {
      this.onDocumentMouseMove(e, input)});
    event.preventDefault();
    this.handleDragStop();
    }
  }

  onTouchStart(event) {
    event.preventDefault();
    if( event.touches.length === 1 && this.state === STATE_PANNING && this.c.clientHeight > this.platformHeight ){
      this.handleDragStart(event.touches[0].clientX , event.touches[0].clientY);
      this.plateContainer.addEventListener('touchmove', (e) => {
        this.onTouchMove(e)});
      this.plateContainer.addEventListener('touchend', (e) => {
        this.onTouchEnd(e)});
      this.plateContainer.addEventListener('touchcancel', this.onTouchEnd);
    }
  }

  onTouchMove(event) {
    event.preventDefault();
    if( event.touches.length  === 1 && this.state === STATE_PANNING){
      this.handleDragging(event.touches[0].clientX, event.touches[0].clientY);
    }
  }

  onTouchEnd(event) {
    event.preventDefault();
    if( event.touches.length  === 0 && this.state === STATE_PANNING){
      this.handleDragStop();
      this.plateContainer.removeEventListener('touchmove', (e) => {
        this.onTouchMove(e)});
      this.plateContainer.removeEventListener('touchend', (e) => {
        this.onTouchEnd(e)});
      this.plateContainer.removeEventListener('touchcancel', (e) => {
        this.onTouchEnd(e)});
    }
  }

  handleDragStart(x ,y ){
    this.input.dragging = true;
    this.input.dragStartX = this.input.dragX = x;
    this.input.dragStartY = this.input.dragY = y;
    this.onAnimationFrame();
  }

  handleDragging(x ,y ){
    if(this.input.dragging) {
      this.input.dragDX = x-this.input.dragX;
      this.input.dragDY = y-this.input.dragY;
      this.input.dragX = x;
      this.input.dragY = y;
      this.onAnimationFrame();
    }
  }

  handleDragStop(){
    if(this.input.dragging) {
      this.input.dragging = false;
      this.input.dragDX=0;
      this.input.dragDY=0;
    }
    this.onAnimationFrame();
    this.canvas.renderAll();
    if (this.tool == 'erase') this.cdr.detectChanges();
  }

  newPage() {
    this.canvas.backgroundImage = 0;
    this.canvas.backgroundColor="white";
    this.canvas.renderAll();
    this.cdr.detectChanges();
  }

  onAddText() {
    this.addText = true;
    this.tool = 'write';
    this.cdr.detectChanges();
  }

  write(pointx, pointy) {
    this.addText = false;
    this.editingMode = 'write';
    this.state = STATE_IDLE;
    this.objectsarray += 1;
    this.canvas.toggleDragMode(false);
    this.canvas.isDrawingMode = false;
    this.text = new fabric.IText('New Text', {
      fontFamily: 'Arial',
      left: pointx,
      top: pointy,
      objecttype: 'text',
      selectable: true,
    });

    this.canvas.add(this.text);
    this.canvas.renderAll();
    this.cdr.detectChanges();
  }

  erase() {
    this.tool = 'erase';
    this.state = STATE_IDLE;
    this.canvas.isDrawingMode = true;
    this.canvas.toggleDragMode(false);
    this.canvas.freeDrawingBrush.color =  'rgba(255,255,255,1)';  //this.color; //
    this.canvas.freeDrawingBrush.width = 25;
    this.canvas.on('path:created', (opt) => {
      opt.path.globalCompositeOperation = 'destination-out';
    });
    this.cdr.detectChanges();
  }

  draw() {
    this.tool = 'pen';
    this.editingMode = 'draw';
    this.state = STATE_IDLE;
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.color = this.color;
    this.canvas.freeDrawingBrush.width = this.brushWidth;
    this.canvas.on('path:created', (opt) => {
      opt.path.globalCompositeOperation = null;
    });
    this.canvas.contextTop.globalCompositeOperation = 'source-over';
    this.canvas.toggleDragMode(false);
    this.cdr.detectChanges();
  }

  renderZoom() {
    this.canvas.setZoom(this.canvas.getZoom());
    this.canvas.setHeight(this.canvas.getHeight());
    this.canvas.setWidth(this.canvas.getWidth());
    /* setTimeout(() => {
      this.canvas.renderAll();
    }, 1); */
    this.cdr.detectChanges();
  }

  zoomIn() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    if(this.canvas.getWidth() * SCALE_FACTOR < 4000) {
      this.canvas.setZoom(this.canvas.getZoom()*SCALE_FACTOR);
      this.canvas.setHeight(this.canvas.getHeight() * SCALE_FACTOR);
      this.canvas.setWidth(this.canvas.getWidth() * SCALE_FACTOR);
      this.cdr.detectChanges();
    }
  }

  zoomOut() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    if(this.canvas.getHeight() * SCALE_FACTOR > 500) {
      this.canvas.setZoom(this.canvas.getZoom()/SCALE_FACTOR);
      this.canvas.setHeight(this.canvas.getHeight() / SCALE_FACTOR);
      this.canvas.setWidth(this.canvas.getWidth() / SCALE_FACTOR);
      this.cdr.detectChanges();
    }
  }

  resetZoom() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    this.canvas.setHeight(this.canvas.getHeight() /this.canvas.getZoom() );
    this.canvas.setWidth(this.canvas.getWidth() / this.canvas.getZoom() );
    this.canvas.setZoom(1);
    this.cdr.detectChanges();
  }

  onchangeColor(value) {
    this.state = STATE_IDLE;
    this.canvas.toggleDragMode(false);
    this.color = value;
    this.canvas.freeDrawingBrush.color = this.color;
    this.cdr.detectChanges();
  }

  lineWidthChange(value) {
    this.state = STATE_IDLE;
    this.canvas.toggleDragMode(false);
    this.brushWidthDiv = !this.brushWidthDiv;
    this.brushWidth = value;
    switch (value) {
      case 3:
        this.brushImage = 2;
        break;
      case 6:
        this.brushImage = 3;
        break;
      case 10:
        this.brushImage = 4;
        break;
    
      default:
        this.brushImage = 1;
        break;
    }
    this.canvas.freeDrawingBrush.width = this.brushWidth;
    this.cdr.detectChanges();
  }

  toggleBrushSize(){
    this.brushWidthDiv = !this.brushWidthDiv;
    this.cdr.detectChanges();
  }

  toggleColor(){
    this.cdr.detectChanges();
  }

  // onchangeFontFamily(value) {
  //   let selectedObject = this.canvas.getActiveObject();
  //   selectedObject.fontFamily = value;
  //   this.canvas.renderAll();
  // }

  undo(){
    let lastItemIndex = (this.canvas.getObjects().length - 1);
    let item = this.canvas.item(lastItemIndex);
    this.objectsarray += 1;
    if(lastItemIndex >= 0) {
    this.h.push(this.canvas._objects.pop());
    this.canvas.renderAll();
    this.cdr.detectChanges();
    }
  }

  redo(){
    if(this.h.length>0){
      this.isRedoing = true;
      this.canvas.add(this.h.pop());
        this.canvas.renderAll();
        this.cdr.detectChanges();
    }
  }


  saveData(index){
    this.pages[index].userid = this.user.id;
    this.pages[index].data = JSON.stringify(this.canvas);

    if (this.onSaving) return;
    this.onSaving = true;
    let loading = this.loadingCtrl.create({
      content: 'Saving your work...'
    });
    // loading.present();

    if(this.mode === 'workbook') {
      let jdata = {
        id: this.pages[index].id,
        workbookid: this.pages[index].workbookid,
        courseid: this.pages[index].courseid,
        url: this.pages[index].url,
        userid: this.user.id,
        data: this.pages[index].data,
        extend: this.pages[index].extend ? this.pages[index].extend : null
      };
      this.webReq.request('local_app_save_user_workbooks', jdata, null, 'post')
        .then((r)=>{
          // AlertServiceProvider.Toast('Saved Changes.', 3000, 'bottom');
          // loading.dismiss();
          this.onSaving = false;
        }).catch(e=>{
          // loading.dismiss();
          AlertServiceProvider.Toast('Error while saving.', 3000, 'bottom');
          this.onSaving = false;
        });

    } else {
      let jdata = JSON.stringify(this.pages);
      this.webReq.request('local_app_save_note', {id:this.courseid, data: jdata}, null, 'post')
      .then((r)=>{
        loading.dismiss();
        this.onSaving = false;
      }).catch(e=>{
        loading.dismiss();
        this.onSaving = false;
      });
    }

  }


  addPage(){
    this.pages[this.pages.length] = {data:'', url:''};
    //this.saveData(this.currentPage);
    this.cdr.detectChanges();
  }

  removePage(id){
    this.pages.splice(id, 1);
    this.cdr.detectChanges();
  }

  close(){
    this.navCtrl.pop();
  }

  share_email(){
    //console.log('share_email');
    AlertServiceProvider.Prompt('Email :', 'Share via email',
    [ { name: 'email', placeholder: 'Email', type: 'email', value: 'dummy@gmil.com'
      //UserServiceProvider.USER.email 
    } ], 'Send', (ok:any)=>{
      if (ok){
        const loader = AlertServiceProvider.Loader("Sending mail ...");
        setTimeout(() => {
          this.webReq.request('local_app_save_chat',
          {
            message:"Shared via Sketch note.", 
            courseid:this.courseid, 
            email:ok.email, 
            // attachment:btoa(this.lc.getImage().toDataURL())
          }, null, 'post')
          .then(res=>{
            loader.dismiss();
            if (!res.error){
              AlertServiceProvider.Toast('Email sent successfully', 3000, 'bottom');
            } else {
              AlertServiceProvider.Toast('Error sending email. ' + res.message, 3000,'bottom');
            }
          }).catch(()=>{
            loader.dismiss();
            AlertServiceProvider.Toast('Error sending email.', 3000, 'bottom');
          })
        }, 100);
      }
    })
  }

  ionViewWillLeave(){
    setTimeout(()=>{
      //this.saveData(this.currentPage);
    },0);
  }

  ngOnDestroy() {
    clearInterval(this.idletimer);
    clearInterval(this.savetimer);
  }

}
