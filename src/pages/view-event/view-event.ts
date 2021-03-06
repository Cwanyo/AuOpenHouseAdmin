import { ViewAttendeesPage } from './../view-attendees/view-attendees';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { Loading } from 'ionic-angular/components/loading/loading';

import { Validators, FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { Event } from './../../interface/event';

import { EditEventPage } from './../edit-event/edit-event';
import { ChatPage } from './../chat/chat';

import { RestApiProvider } from './../../providers/rest-api/rest-api';
import {} from '@types/googlemaps';

/**
 * Generated class for the ViewEventPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-view-event',
  templateUrl: 'view-event.html',
})
export class ViewEventPage {

  @ViewChild("map") mapRef: ElementRef;
  private map: google.maps.Map;
  private eventMapMarker: google.maps.Marker;

  public event: Event;

  public listEventTimeAttendess = [];

  private loader: Loading;

  public eventForm: FormGroup;

  public minSelectabledate;
  public maxSelectabledate;

  public listFaculties;
  public listMajors;

  public Image: string;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private restApiProvider: RestApiProvider,
    public formBuilder: FormBuilder,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
  }

  ngOnInit(){
    this.event = this.navParams.get("event");
    console.log("Event",this.event);

    this.showMap();
    this.getListOfFaculties();

    let d = new Date();
    this.minSelectabledate = d.getFullYear();
    this.maxSelectabledate = d.getFullYear()+1;

    this.initEvent();
    this.eventForm.disable();
  }

  showMap(){
    //set default map location
    const location = new google.maps.LatLng(13.612111, 100.837667);
    //set map options
    const options = {
      center: location,
      zoom: 17
    };

    this.map = new google.maps.Map(this.mapRef.nativeElement,options);
  }

  placeMarker(location, map){
    if(this.eventMapMarker){
      this.eventMapMarker.setPosition(location);
    }else{
      this.eventMapMarker = new google.maps.Marker({
        position: location,
        map: map
      });
    }
  }

  viewChat(){
    console.log("viewChat");
    this.navCtrl.push(ChatPage, {eid: this.event.EID});
  }

  initEvent(){
    //Change NULL to empty 
    if(this.event.Image == null){
      this.event.Image = "";
    }else{
      this.Image = this.event.Image;
    }
    if(this.event.Location_Latitude&&this.event.Location_Longitude){
      this.placeMarker(new google.maps.LatLng(Number(this.event.Location_Latitude),Number(this.event.Location_Longitude)),this.map);
      this.map.setCenter(this.eventMapMarker.getPosition());
    }else{
      this.event.Location_Latitude = "";
      this.event.Location_Longitude = "";
    }
    if(this.event.FID == null){
      this.event.FID = "-1";
    }
    if(this.event.MID == null){
      this.event.MID = "-1";
    }
    //--
    this.eventForm = this.formBuilder.group({
      EID: this.event.EID.toString(),
      Name: [this.event.Name.toString(), [Validators.required]],
      Info: [this.event.Info.toString(), [Validators.required]],
      Image: this.event.Image.toString(),
      State: [this.event.State.toString(), [Validators.required]],
      Location_Latitude: this.event.Location_Latitude.toString(),
      Location_Longitude: this.event.Location_Longitude.toString(),
      Event_Time: this.formBuilder.array([]),
      MID: [this.event.MID.toString(), [Validators.required]],
      FID: [this.event.FID.toString(), [Validators.required]]
    });
    //set major 
    this.hintMajors(Number(this.event.FID));
    this.eventForm.patchValue({MID: this.event.MID.toString()});
    //set event time
    this.initEventTime();
  }

  convertTime(time: string){
    let temp = time.split(" ");
    return temp[0]+"T"+temp[1]+".000Z"
  }

  initEventTime(){
    this.restApiProvider.getEventTime(Number(this.event.EID))
    .then(result => {
      let json: any = result;
      const control = <FormArray>this.eventForm.controls["Event_Time"];
      json.forEach(t => {
        control.push(this.formBuilder.group({
          TID: t.TID,
          Time_Start: [this.convertTime(t.Time_Start), [Validators.required]],
          Time_End: [this.convertTime(t.Time_End), [Validators.required]]
        }));
        this.getNumberOfEventTimeAttendess(t.TID);
        control.disable();
      });
    })
    .catch(error =>{
      console.log("ERROR API : getEventTime",error);
    })
  }

  getNumberOfEventTimeAttendess(tid: number){
    this.restApiProvider.getEventTimeAttendess(0,tid)
    .then(result => {
      //this.listEventTimeAttendess.push(result);
      this.listEventTimeAttendess[tid.toString()] = result;
      console.log(this.listEventTimeAttendess);
    })
    .catch(error =>{
      //this.listEventTimeAttendess.push([]);
      this.listEventTimeAttendess[tid.toString()] = [];
      console.log("ERROR API : getEventTimeAttendess",error);
    });
  }

  viewAttendees(tid: number){
    console.log("viewAttendees", tid);
    let attendees = this.listEventTimeAttendess[tid];

    this.navCtrl.push(ViewAttendeesPage, {attendees: attendees})
  }

  getListOfFaculties(){
    this.restApiProvider.getFaculties()
    .then(result => {
      this.listFaculties = result;
    })
    .catch(error =>{
      console.log("ERROR API : getFaculties",error);
    })
  }

  hintMajors(fid: number){
    this.eventForm.patchValue({MID:"-1"});
    if(fid == -1){
      this.listMajors = null;
      return;
    }
    this.restApiProvider.getMajorsInFaculty(fid)
    .then(result => {
      this.listMajors = result;
    })
    .catch(error =>{
      console.log("ERROR API : getMajorsInFaculty",error);
    })
  }

  eventEdit(){
    console.log("editEvent");
    let event = this.event;
    
    this.navCtrl.push(EditEventPage, {event: event, "parentPage":  this.navParams.get("parentPage")});
  }

  presentAlert(message) {
    let alert = this.alertCtrl.create({
      title: 'Alert!',
      subTitle: message,
      enableBackdropDismiss: false,
      buttons: [{
        text: 'Ok'
      }]
    });
    alert.present();
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create({
      content: "Please wait..."
    });
    this.loader.present();
  }

}
