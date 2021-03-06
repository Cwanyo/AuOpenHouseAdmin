import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController } from 'ionic-angular'
import { Loading } from 'ionic-angular/components/loading/loading';

import { CreateEventPage } from './../create-event/create-event';
import { EditEventPage } from './../edit-event/edit-event';
import { ViewEventPage } from './../view-event/view-event';

import { Event } from './../../interface/event';

import { RestApiProvider } from './../../providers/rest-api/rest-api';

/**
 * Generated class for the EventManagementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-event-management',
  templateUrl: 'event-management.html',
})
export class EventManagementPage {

  private loader: Loading;

  public eventState = "1";

  public events = [];
  public faculties = [];

  public rawListOfEvents;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private restApiProvider: RestApiProvider,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
  }

  ngOnInit(){
    this.getListOfEvents();
  }

  doRefresh(refresher) {
    this.restApiProvider.getEvents(Number(this.eventState))
    .then(result => {
      this.rawListOfEvents = result;
      this.faculties = Object.keys(this.groupByFaculty(result));
      this.events = this.groupByFaculty(result);
      refresher.complete();
    })
    .catch(error =>{
      console.log("ERROR API : getEvents",error);
      refresher.complete();
    })
  }

  getListOfEvents(){
    this.presentLoading();
    this.restApiProvider.getEvents(Number(this.eventState))
    .then(result => {
      this.loader.dismiss();
      this.rawListOfEvents = result;
      this.faculties = Object.keys(this.groupByFaculty(result));
      this.events = this.groupByFaculty(result);
    })
    .catch(error =>{
      this.loader.dismiss();
      console.log("ERROR API : getEvents",error);
    })
  }

  groupByFaculty(facultyValues){
    return facultyValues.reduce((groups, facultyed) => {
      let key = "All";
      if(facultyed.Faculty_Name){
        key = facultyed.Faculty_Name;
      }
      if (groups[key]) {
        groups[key].push(facultyed);
      } else {
        groups[key] = [facultyed];
      }
      return groups;
    }, {});
  }

  createEvent(param){
    if (!param) param = {};
    console.log("createEvent")
    this.navCtrl.push(CreateEventPage, {"parentPage": this});
  }

  eventDetails(eid: number){
    console.log("viewEvent",eid);
    let event: Event = this.rawListOfEvents.find(i => i.EID === eid);
    
    this.navCtrl.push(ViewEventPage, {event: event, "parentPage": this});
  }

  eventEdit(eid: number){
    console.log("editEvent",eid);
    let event: Event = this.rawListOfEvents.find(i => i.EID === eid);
    
    this.navCtrl.push(EditEventPage, {event: event, "parentPage": this});
  }

  eventEnable(eid: number){
    console.log("eventEnable:",eid);
    let confirm = this.alertCtrl.create({
      title: "Alert!",
      message: "Are you sure that you want to enable this event?",
      enableBackdropDismiss: false,
      buttons: [{
        text: "Disagree"
      },{
        text: "Agree",
        handler: () => {
          //TODO - event the event (use api)
          console.log('Agree clicked');
          this.presentLoading();
          this.restApiProvider.enableEvent(eid)
          .then(result => {
            console.log("enable event success");
            this.loader.dismiss();
            this.getListOfEvents();
            var jsonData: any = result;
            if(jsonData.isSuccess){
              this.presentAlert(jsonData.message);
            }
          })
          .catch(error =>{
            this.loader.dismiss();
            console.log("ERROR API : enableEvent",error);
            if(error.status == 0){
              //show error message
              this.presentAlert("Cannot connect to server");
            }else{
              //show error message
              try {
                var jsonData = JSON.parse(error.error);
                this.presentAlert(jsonData.message);
              } catch (e) {
                this.presentAlert(error.statusText);
              }
            }
          });
        }
      }]
    });
    confirm.present();
  }

  eventDisable(eid: number){
    console.log("eventDisable:",eid);
    let confirm = this.alertCtrl.create({
      title: "Alert!",
      message: "Are you sure that you want to disable this event?",
      enableBackdropDismiss: false,
      buttons: [{
        text: "Disagree"
      },{
        text: "Agree",
        handler: () => {
          //TODO - disable the event (use api)
          console.log('Agree clicked');
          this.presentLoading();
          this.restApiProvider.disableEvent(eid)
          .then(result => {
            console.log("disabled event success");
            this.loader.dismiss();
            this.getListOfEvents();
            var jsonData: any = result;
            if(jsonData.isSuccess){
              this.presentAlert(jsonData.message);
            }
          })
          .catch(error =>{
            this.loader.dismiss();
            console.log("ERROR API : disableEvent",error);
            if(error.status == 0){
              //show error message
              this.presentAlert("Cannot connect to server");
            }else{
              //show error message
              try {
                var jsonData = JSON.parse(error.error);
                this.presentAlert(jsonData.message);
              } catch (e) {
                this.presentAlert(error.statusText);
              }
            }
          });
        }
      }]
    });
    confirm.present();
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

