import { EditEventPage } from './../edit-event/edit-event';
import { NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { Loading } from 'ionic-angular/components/loading/loading';

import { Component } from '@angular/core';

import { Validators, FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { Event } from './../../interface/event';

import { RestApiProvider } from './../../providers/rest-api/rest-api';

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

  public event: Event;

  private loader: Loading;

  public eventForm: FormGroup;

  public minSelectabledate;
  public maxSelectabledate;

  public listFaculties;
  public listMajors;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private restApiProvider: RestApiProvider,
    public formBuilder: FormBuilder,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
    this.event = navParams.get("event");
    console.log("Event",this.event);
  }

  ngOnInit(){
    this.getListOfFaculties();

    let d = new Date();
    this.minSelectabledate = d.getFullYear();
    this.maxSelectabledate = d.getFullYear()+1;

    this.initEvent();
    this.eventForm.disable();
  }

  initEvent(){
    //Change NULL to empty 
    if(this.event.Image == null){
      this.event.Image = "";
    }
    if(this.event.Location_Latitude == null){
      this.event.Location_Latitude = "";
    }
    if(this.event.Location_Longitude == null){
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
      State: this.event.State.toString(),
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
      json.forEach(t => {
        const control = <FormArray>this.eventForm.controls["Event_Time"];
        control.push(this.formBuilder.group({
          TID: t.TID,
          Time_Start: [this.convertTime(t.Time_Start), [Validators.required]],
          Time_End: [this.convertTime(t.Time_End), [Validators.required]]
        }));
      });
    })
    .catch(error =>{
      console.log("ERROR API : getEventTime",error);
    })
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

  eventEdit(eid: number){
    console.log("editEvent",eid);
    let event = this.event;
    
    this.navCtrl.push(EditEventPage, {event: event, "parentPage":  this.navParams.get("parentPage")});
  }

  presentLoading() {
    this.loader = this.loadingCtrl.create({
      content: "Please wait..."
    });
    this.loader.present();
  }

}
