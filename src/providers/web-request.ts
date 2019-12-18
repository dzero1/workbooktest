import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
//import { AppConfig } from './app-config';
//import { UserServiceProvider } from './user-service';
import { Observable } from 'rxjs';
//import { FileTransfer, FileUploadOptions } from '@ionic-native/file-transfer';
//import { File } from '@ionic-native/file';

@Injectable()
export class WebRequestProvider {

  static token = 'a3862ff04142389f3f9f84613bffd089';
  static url = "http://52.187.170.78/test2";

  constructor(private http: HttpClient){ //, private transfer: FileTransfer, private file: File) {
    //console.log('Hello WebRequestProvider Provider');
  }

  request(api, requestData:any = {}, httpHeaders:HttpHeaders = null, method:string = 'post'):Promise<any>{
    // Setting headers and content type for http post request
    let _headers = new HttpHeaders()
    .set('Content-Type', 'application/json');
    if (httpHeaders) 
      for (const key in httpHeaders)
        if (httpHeaders.hasOwnProperty(key)) _headers.set(key, httpHeaders[key])

    //let url = 'http://52.187.170.78/test2/webservice/rest/server.php';
    let url = WebRequestProvider.url +'/webservice/rest/server.php';

    let urlData:any;
    urlData = Object.assign({}, requestData);
    urlData.moodlewsrestformat = 'json';
    urlData.wsfunction = api;
    urlData.wstoken = WebRequestProvider.token; //'a3862ff04142389f3f9f84613bffd089';

    //console.log(`WEB REQ - ${api}`);

    // Create a promise for http.post
    return new Promise((resolve, reject)=>{
      let req:Observable<any>;
      if (method == 'get'){
        
        req = this.http.get(url, {headers: _headers, params: urlData})
      } else {

        let frmdata = new FormData();
        for (const key in urlData) {
          if (urlData.hasOwnProperty(key)) {
            const element = urlData[key];
            frmdata.append(key, element);
          }
        }

        frmdata.append("wstoken", 'a3862ff04142389f3f9f84613bffd089');
        frmdata.append("wsfunction", api);
        frmdata.append("moodlewsrestformat", "json");

        //headers.set('Content-Type', 'application/json');
        _headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
        _headers.set('cache-control', 'no-cache');
        req = this.http.post( url, frmdata);
        //req = this.http.request('POST', url, {headers: _headers, body: frmdata});
        /* req = this.sendXHR(url, urlData, 'post'); */

        /* let _params:HttpParams = new HttpParams({fromString: this.serialize(urlData) });
        req = this.http.request('post', url, { headers: headers, body: this.serialize(urlData) }); */

      }

      req.subscribe((data) => {
        if (typeof data == 'string'){
          const jdata = JSON.parse(data);
          if (jdata.exception !== undefined){
            //console.log(jdata);
            reject(jdata.message);
          }
        }
        resolve(data);
      }, (err) => {
        console.log(err);
        reject(err.message);
      }); 

    });
  }

  uploadFilesByFormPost(formData: FormData = null, filepath = '/', filearea = 'draft', itemid:any = 0){
    return new Promise((resolve, reject)=>{
      const url = 'http://52.187.170.78/test2/webservice/upload.php';
      /* let urlData:any;
      urlData = Object.assign({}, requestData);
      urlData.wsfunction = api;
      urlData.wstoken = 'a3862ff04142389f3f9f84613bffd089'; */

      if (formData == null) formData = new FormData();

      formData.append('filearea', filearea);
      formData.append('filepath', filepath);
      formData.append('itemid', itemid);
      formData.append('token', 'a3862ff04142389f3f9f84613bffd089');

      let httpOptions = {
        headers: new HttpHeaders({
          //'enctype': 'multipart/form-data',
        }),
      };

      this.http.post(url, formData, httpOptions).subscribe(data => {
        resolve(data);
      }, (error) => {
        reject(error.status);
      });
    });
  }

 /*  async uploadFiles(files:Array<any>, filepath = '/', filearea = 'draft', itemid = 0):Promise<any>{
    const url = 'http://52.187.170.78/test2/webservice/upload.php';

    let filesToUpload = files;
    let promisesArray: Array<any> = [];
    let returns = [];
    let fileuploaded = 0;

    let options: FileUploadOptions = {};
    options.httpMethod = 'POST';
    options.chunkedMode = false;
    options.headers = {
      Connection: 'close'
    };

    for (const file of filesToUpload) {
      //console.log("Starting upload: %s", file);

      options.params = {
        token: 'a3862ff04142389f3f9f84613bffd089',
        filearea: filearea || 'draft',
        itemid: itemid || 0
      };

      promisesArray.push(this.upload(file, url, options));

      if (filesToUpload.length == fileuploaded)
      return await new Promise((resolve, reject)=>{
        Promise.all(promisesArray)
        .then((res) => {
          resolve(returns)
        }, (firstErr) => {
          reject(firstErr)
        });
      });


    }
  } */

  /* private async upload(file, url, options){
    return await new Promise((resolve, reject)=>{

      let fileReader = new FileReader();
      fileReader.onload = (e:any)=>{
        this.transfer.create().upload(e.target.result, url, options).then(r=>{
          resolve(r);
        }).catch(e=>{
          reject(e);
        });
      }
      fileReader.readAsDataURL(file);

    });
  } */


  get(url, requestData:any = {}, httpHeaders:HttpHeaders = null):Promise<any>{
    // Setting headers and content type for http post request
    let headers = new HttpHeaders();
    if (httpHeaders != null) headers = httpHeaders;
    headers.append('Content-Type','text/plain');
   
    // Create a promise for http.post
    return new Promise((resolve, reject)=>{
      this.http.get(url, {headers: headers, responseType: 'text'})
      .subscribe(data => {
          resolve(data);
        }, (err) => {
          console.log(err);
          reject(err);
        }
      );
    });
  }

  getFileURL(cmid, type, httpHeaders:HttpHeaders = null):string{
    return 'http://52.187.170.78/test2/local/app/pluginfile.php?token='+ 'a3862ff04142389f3f9f84613bffd089'  +
        '&cmid='+ cmid +'&type='+type;
  }

  setcompletion(type, cmid, element, value): Promise<any> {
    let requestData = [];
    requestData["type"] = type;
    requestData["cmid"] = cmid;
    requestData["element"] = element;
    requestData["value"] = value;

    return this.request('local_app_moduleCompletion', requestData).catch(()=>{});
  }


  sendXHR(siteUrl:string, data, method = 'post'){
    return new Observable(observer => {
      // Perform sync request using XMLHttpRequest.
      let xhr = new (<any> window).XMLHttpRequest();
      xhr.open(method, siteUrl, false);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');

      xhr.send(this.serialize(data));

      // Get response.
      data = ('response' in xhr) ? xhr.response : xhr.responseText;

      // Check status.
      const status = Math.max(xhr.status === 1223 ? 204 : xhr.status, 0);
      if (status < 200 || status >= 300) {
          // Request failed.
          observer.error(data);
      }

      // Treat response.
      data = JSON.parse(data);
      observer.next(data);
    });
  }

  serialize(obj: any, addNull?: boolean): string {
    let query = [],
        fullSubName,
        subValue,
        innerObj;

    for (const name in obj) {
        const value = obj[name];

        if (value instanceof Array) {
            for (let i = 0; i < value.length; ++i) {
                subValue = value[i];
                fullSubName = name + '[' + i + ']';
                innerObj = {};
                innerObj[fullSubName] = subValue;
                query.push(this.serialize(innerObj));
            }
        } else if (value instanceof Object) {
            for (const subName in value) {
                subValue = value[subName];
                fullSubName = name + '[' + subName + ']';
                innerObj = {};
                innerObj[fullSubName] = subValue;
                query.push(this.serialize(innerObj));
            }
        } else if (addNull || (typeof value != 'undefined' && value !== null)) {
            query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
        }
    }

    return query.join('&');
  }

}
