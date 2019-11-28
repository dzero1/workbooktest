import { Component, ChangeDetectorRef } from '@angular/core';
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

@IonicPage()
@Component({
  selector: 'page-myworkbook-new',
  templateUrl: 'myworkbook-new.html',
})
export class MyworkbookNewPage {

  workbookid:number;
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

  isMobile = false;

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
    this.workbookid = 11;
    this.mode = 'workbook';
    this.courseid = 107;
    /* if (navParams.get('book') !== undefined && !isNaN(navParams.get('book'))) {
      this.workbookid = navParams.get('book');
    }
    if (navParams.get('user') !== undefined && !isNaN(navParams.get('user'))) {
      this.user = navParams.get('user');
    } */
    //this.user = UserServiceProvider.USER;
    //if (navParams.get('mode') !== undefined) {
      /* this.pages = navParams.get('pages');
      this.mode = navParams.get('mode');
      this.courseid = navParams.get('courseid'); */
      
    //}
    
    platform.ready().then((readySource) => {
      this.platformHeight = platform.height();
      this.platformWidth = platform.width();

      if (platform.is('android') || platform.is('ios')) {
        this.isMobile = true;
      }

      this.webReq.request('local_app_get_workbook_data',  {workbookid: this.workbookid, userid:this.user })
      .then(res=>{
        this.pages = res;
        this.canvasInit();
        //this.detectChanges();

        setTimeout(() => {
          let page = 0;
          /* if (navParams.get('page') !== undefined && !isNaN(navParams.get('page'))) {
            page = navParams.get('page')-1;
          } */
          this.setCanvas(page, res[page]);
        }, 3000);
      }).catch((error)=>{
        console.log(error)
      });

      this.loading = this.loadingCtrl.create({
        content: 'Loading...'
      });
      this.loading.present();

    });

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
      this.detectChanges();
    });

    /* this.tapGesture = new Gesture(this.plateContainer);
		this.tapGesture.listen();
    this.tapGesture.on('tap', ev => {
      if(this.addText) {
        const pointx = ev.srcEvent.offsetX;
        const pointy = ev.srcEvent.offsetY;
        this.write(pointx, pointy);
      }
    }); */
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
    /* if(i == 0) {
      this.canvasInit();
    } */
  }
  
  alreadyInit:boolean = false;
  canvasInit() {
    if (this.alreadyInit) return;
    this.alreadyInit = true;
    this.canvas = new fabric.Canvas('canvasId', { renderOnAddRemove: false, enableRetinaScaling:false });

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
          //object.selectable = false;
        });
        // Remove selection ability on the canvas
        this.selection = false;
      } else {
        this.defaultCursor = 'default';
        // When we exit dragmode, we restore the previous values on all objects
        this.forEachObject(function(object) {
          object.evented = (object.prevEvented !== undefined) ? object.prevEvented : object.evented;
          //object.selectable = (object.prevSelectable !== undefined) ? object.prevSelectable : object.selectable;
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
        if (this.tool == 'erase'|| this.tool == 'pen') this.detectChanges();
        if (this.addText) this.canvas.isDrawingMode = false;
        console.log(e);
        if (e.target && e.target.type === 'i-text') {
          e.target.enterEditing();
          //e.target.hiddenTextarea.focus();
          //fabicText.hiddenTextarea.focus();
          this.detectChanges();
        }
      },
      'mouse:move': (e) => {
        //this.canvas.renderAll();
      },
      'mouse:up': (e) => {
        if (this.tool == 'erase'|| this.tool == 'pen') this.renderZoom();
        if (this.addText) {
          const pointx = e.pointer.x;
          const pointy = e.pointer.y;
          this.write(pointx, pointy);
        }
      },
      'mouse:out': (e) => {
        if (this.tool == 'erase'|| this.tool == 'pen') this.detectChanges();
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
      //this.canvas.setDimensions({width:width, height:height});
      this.canvas.setHeight(height);
      this.canvas.setWidth(width);
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
    //  this.detectChanges();
    //   }
    //}, 1000);
    this.loading.dismiss();
    //this.detectChanges();
  }

  setCanvas(index, page) {

    if (this.currentPage == index) return;

    let loading = this.loadingCtrl.create({
      content: 'Loading...'
    });
    //loading.present();

    this.resetZoom();
    //this.draw();
    this.h = [];
    if(this.currentPage !== undefined && this.objectsarray > 0 ) {
      // this.generateImage();
      //this.pages[this.currentPage].userid = this.user;
      this.pages[this.currentPage].data = JSON.stringify(this.canvas);
      this.saveData(this.currentPage);
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
    //this.canvas.setDimensions({width:width, height:height});
    this.canvas.setHeight(height,);
    this.canvas.setWidth(width);
    if(this.pages[index].data !== '') {
      this.canvas.loadFromJSON(this.pages[index].data, ()=>{
        this.canvas.renderAll.bind(this.canvas);
        this.detectChanges();
      });
      this.generateImage();
      this.detectChanges();
    } else {
      this.canvas.setBackgroundImage(this.pages[index].url, ()=>{
        this.canvas.renderAll.bind(this.canvas);
        this.detectChanges();
      });
      this.detectChanges();
    }
    this.canvasImage = page.url;
    this.detectChanges();

    setTimeout(() => {
      this.renderZoom();      
    }, 500);

    loading.dismiss();
  }

  async generateImage() {
    // convert it into a dataURL, then back to a fabric image
    const newData = this.canvas.toDataURL({
      withoutTransform: true,
      quality: 1
    });

    /* const objects = this.canvas.getObjects();
    this.canvas.remove(objects);
    this.canvas.clear(); */
    this.clear();
    this.objectsarray--;
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
    //this.canvas.setDimensions({width:width, height:height});
    this.canvas.setHeight(height);
    this.canvas.setWidth(width);
    this.detectChanges();
  }

  removeExtendPage() {
    let extendedHeight = JSON.parse(this.pages[this.currentPage].extend);
    if(extendedHeight && extendedHeight.height && extendedHeight.height > 0) {
      extendedHeight.height =  extendedHeight.height - PAGE_EXTEND_HEIGHT;
      this.pages[this.currentPage].extend = JSON.stringify(extendedHeight);
      let height =  this.pages[this.currentPage].height + extendedHeight.height;
      let width = this.pages[this.currentPage].width;
      //this.canvas.setDimensions({width:width, height:height});
      this.canvas.setHeight(height);
      this.canvas.setWidth(width);
    } else {
      this.pages[this.currentPage].extend = null;
    }
    this.detectChanges();
  }

  pan() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    this.detectChanges();
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
    if (this.tool == 'erase') this.detectChanges();
  }

  newPage() {
    this.canvas.backgroundImage = 0;
    this.canvas.backgroundColor="white";
    this.canvas.renderAll();
    this.detectChanges();
  }

  onAddText() {
    this.addText = true;
    this.tool = 'write';
    this.detectChanges();
  }

  tmp_top;
  on_overlap_editing;
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
      isEditing: true,
    });
    this.text.on('editing:exited', (e)=>{
      if (this.isMobile && this.on_overlap_editing){
        const left = (new WebKitCSSMatrix(window.getComputedStyle(this.plateContainer).transform)).m41;
        this.plateContainer.style['transform']= 'translate('+left+'px,'+this.tmp_top+'px) translateZ(0)';
        this.on_overlap_editing = false;
      }
    });
    this.text.on('editing:entered', (e)=>{
      this.fixKeyboard();
    });
    this.text.selectAll()
    this.text.enterEditing();
    
    this.fixKeyboard();

    this.canvas.add(this.text);
    this.canvas.renderAll();
    this.detectChanges();
  }

  fixKeyboard() {
    setTimeout(() => {
      if (this.text && this.text.type === 'i-text') {
        this.text.enterEditing();
        if (this.text.hiddenTextarea) this.text.hiddenTextarea.focus();
      }
    }, 100);

    if (this.isMobile && this.text){
      const half_height = document.body.clientHeight/2;
      const left = (new WebKitCSSMatrix(window.getComputedStyle(this.plateContainer).transform)).m41;
      const top = (new WebKitCSSMatrix(window.getComputedStyle(this.plateContainer).transform)).m42;
      if (this.text.top > (half_height + top)){
        this.on_overlap_editing = true;
        this.tmp_top = top;
        this.plateContainer.style['transform']= 'translate('+left+'px,'+(top - half_height)+'px) translateZ(0)';
      }
    }
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
    this.detectChanges();
  }

  draw() {
    this.tool = 'pen';
    this.editingMode = 'draw';
    this.state = STATE_IDLE;
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.color = this.color;
    this.canvas.freeDrawingBrush.width = this.brushWidth;
    this.canvas.freeDrawingBrush.strokeLineCap = 'round';
    this.canvas.freeDrawingBrush.strokeLineJoin = 'round';
    this.canvas.freeDrawingBrush.decimate = 1;
    this.canvas.on('path:created', (opt) => {
      opt.path.globalCompositeOperation = null;
    });
    this.canvas.contextTop.globalCompositeOperation = 'source-over';
    this.canvas.toggleDragMode(false);
    this.detectChanges();
  }

  toggle_highlight_color = false;
  clickOutSide(){
    this.toggle_highlight_color = false;
  }
  highlight_color = "#ffff00";
  changeHighlightColor(color){
    this.toggle_highlight_color = false;
    this.canvas.freeDrawingBrush.color = color + '66';
    this.detectChanges();
  }
  highlight() {
    setTimeout(() => {
      this.toggle_highlight_color = true;      
    }, 1);

    this.tool = 'highlight';
    this.editingMode = 'draw';
    this.state = STATE_IDLE;
    this.canvas.isDrawingMode = true;
    this.canvas.freeDrawingBrush.color = this.highlight_color + '66';
    this.canvas.freeDrawingBrush.width = 20;
    this.canvas.freeDrawingBrush.strokeLineCap = 'round';
    this.canvas.freeDrawingBrush.strokeLineJoin = 'round';
    this.canvas.freeDrawingBrush.decimate = 1;
    this.canvas.on('path:created', (opt) => {
      opt.path.globalCompositeOperation = null;
    });
    this.canvas.contextTop.globalCompositeOperation = 'source-over';
    this.canvas.toggleDragMode(false);
    this.detectChanges();
  }

  renderZoom() {
    this.canvas.setZoom(this.canvas.getZoom());
    this.canvas.setHeight(this.canvas.getHeight());
    this.canvas.setWidth(this.canvas.getWidth());
    this.detectChanges();
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
      this.detectChanges();
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
      this.detectChanges();
    }
  }

  resetZoom() {
    this.tool = 'pan';
    this.state = STATE_PANNING;
    this.canvas.isDrawingMode = false;
    this.canvas.toggleDragMode(true);
    this.canvas.setZoom(1);
    this.canvas.setHeight(this.canvas.getHeight() /this.canvas.getZoom() );
    this.canvas.setWidth(this.canvas.getWidth() / this.canvas.getZoom() );
    this.detectChanges();
  }

  onchangeColor(value) {
    this.state = STATE_IDLE;
    this.canvas.toggleDragMode(false);
    this.color = value;
    this.canvas.freeDrawingBrush.color = this.color;
    this.detectChanges();
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
    this.toggleBrushSize();
    this.detectChanges();
  }

  toggleBrushSize(){
    this.brushWidthDiv = !this.brushWidthDiv;
    this.detectChanges();
  }

  toggleColor(){
    this.detectChanges();
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
    this.detectChanges();
    }
  }

  redo(){
    if(this.h.length>0){
      this.isRedoing = true;
      this.canvas.add(this.h.pop());
        this.canvas.renderAll();
        this.detectChanges();
    }
  }


  saveData(index){
    //this.pages[index].userid = this.user;
    this.pages[index].data = JSON.stringify(this.canvas);

    if (this.onSaving) return;
    this.onSaving = true;
    let loading = this.loadingCtrl.create({
      content: 'Saving your work...'
    });
    //loading.present();

      let jdata = {
        id: this.pages[index].id,
        workbookid: this.workbookid,
        courseid: this.courseid,
        url: this.pages[index].url,
        userid: this.user,
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
  }

  addPage(){
    this.pages[this.pages.length] = {data:'', url:''};
    this.saveData(this.currentPage);
    this.detectChanges();
  }

  removePage(id){
    this.pages.splice(id, 1);
    this.detectChanges();
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

  /* ionViewWillLeave(){
    setTimeout(()=>{
      this.saveData(this.currentPage);
    },0);
  } */

  ngOnDestroy() {
    clearInterval(this.idletimer);
    clearInterval(this.savetimer);
  }

  clear(){
    const objects = this.canvas.getObjects();
    this.canvas.remove(objects);
    this.canvas.clear();
    this.objectsarray++;
  }

  detectChanges(){
    try {
      this.cdr.detectChanges();      
    } catch (error) {
    }
  }

}
