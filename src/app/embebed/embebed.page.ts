import { CalendarComponent } from 'ionic2-calendar/calendar';
import { Component, ViewChild, OnInit, Inject, LOCALE_ID } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { formatDate } from '@angular/common';
import { CausasService } from '../_service/causas.service';
import { dbUserService } from '../_service/user.service';
import { CalendarioServices } from '../_service/calendario.service';
import { LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AreaService } from '../_service/area.service';
import { CreadorEmbebedPage } from '../creador-embebed/creador-embebed.page';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-embebed',
  templateUrl: './embebed.page.html',
  styleUrls: ['./embebed.page.scss'],
})
export class EmbebedPage implements OnInit {

  months =  {"January":"Enero","February":"Febrero","March":"Marzo","April":"Abril","May":"Mayo","June":"Junio","July":"Julio","August":"Agosto","September":"Septiembre","October":"Octubre","November":"Noviembre","December":"Diciembre"};
  causa = undefined;
  event = {
    title: '',
    desc: '',
    startTime: '',
    endTime: '',
    allDay: false
  };

  minDate = new Date().toISOString();
  evento = {sucursal:'',tipo:'',causa:[],personal:false,cliente:0,observacion:''}
  eventSource = [];
  viewTitle;
  viewTitleNumber;

  calendar = {
    mode: 'month',
    currentDate: new Date(),
  };
  cargandoModal = false;
  clientes = [];
  causas = [];
  enterprise : string;
  token : string;
  users = [];
  cargandoCausas = false;

  @ViewChild(CalendarComponent, {static: false}) myCal: CalendarComponent;

  constructor(
    private areaService : AreaService,
    private router : ActivatedRoute,
    private calendarService:CalendarioServices,
    private userService : dbUserService ,
    private causasService : CausasService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    @Inject(LOCALE_ID) private locale: string) {    
    router.queryParams.subscribe(parameter => {
        
        const {token,enterprise} = parameter;
        this.enterprise = enterprise;
        this.token = token;
        this.getAreas(token,enterprise);
    })  

  }
  getCausas(token,enterprise,area){
    this.causasService.listarTodos(token,enterprise,area.id).subscribe(cs=>{      
      for(var i = 0 ; i < cs.length; i++){
        const causa = cs[i];            
        causa.rolInterno = " ( "+(i+1)+" ). " + area.code;
        this.causas.push(causa);          
      }      
    })

  }
  getAreas(token,enterprise){    
    this.areaService.listar(token,enterprise).subscribe( (result) =>{      
      for(const area of result){
        //console.log(area);
        this.getCausas(token,enterprise,area)
      }
    })
  }
  ngOnInit() {
    this.getEnterpriseUsers();
    const self = this;
    setInterval( function(){
      self.calendarService.listar(self.enterprise).subscribe(eventos=>{
        self.eventSource = [];
        for(var evento of eventos){
          evento.startTime = new Date(evento.startTime)
          evento.endTime = new Date(evento.endTime)
          self.eventSource.push(evento);
        }
        self.myCal.loadEvents();
      }, err=>{
        
      })
    } , 5000 );
    this.resetEvent();
  }


  resetEvent() {
    this.event = {
      title: '',
      desc: '',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      allDay: false
    };
    this.evento = {sucursal:'',tipo:'',causa:[],personal:false,cliente:0,observacion:''};
  }

  // Create the right event format and reload source
  addEvent() {
    var causas = "";
    var obs = "";
    if(this.evento.causa.length == 1){
      causas += this.evento.causa[0].rolInterno;
    }else{
      causas += "Multiples causas"
      obs += "<b>Causas:</b><br>";
      for(var causa of this.evento.causa){
        obs += "<b>"+causa.rolInterno+"</b><br>";
      }
      obs += "<br>"
    }
    var titulo = this.evento.tipo+" - "+causas+" ( PERSONA/S )";
    var desc = this.evento.observacion;

    switch (this.evento.tipo) {
      case 'Reunión':
        obs += "<b>FINALIDAD:</b> "+this.evento['finalidad'];
        break;
      case 'Trámite':
        if(this.evento['personal']){
            obs = "<b>Trámite Personal</b><br>";
        }
        obs += "<b>LUGAR:</b> "+this.evento['lugar'] || 'No definido';
        obs += "<br><b>DETALLE:</b> "+this.evento['detalle'] || 'No definido';
        break;
      case 'Atención':
        obs += "<b>NOMBRE:</b> "+this.evento['nombreAtencion'] || 'No definido';
        obs += "<br><b>TELÉFONO:</b> "+this.evento['telefonoAtencion'] || 'No definido';
        break ;
      case 'Audiencia':
        obs += "<b>PROCEDIMIENTO:</b> "+this.evento['procedimientoAudiencia'] || 'No definido';
        obs += "<br><b>TRIBUNAL:</b> "+this.evento['tribunalAudiencia'] || 'No definido';
        obs += "<br><b>TIPO DE AUDIENCIA:</b> "+this.evento['tipoAudiencia'] || 'No definido';
        obs += "<br><b>CARATULADO:</b> "+this.evento['caratuladoAudiencia'] || 'No definido';
        obs += "<br><b>ROL / RIT:</b> "+this.evento['rolAudiencia'] || 'No definido';
        obs += "<br><b>RUC:</b> "+this.evento['rucAudiencia'] || 'No definido';
        obs += "<br><b>HORA:</b> "+this.evento['horaAudiencia'] || 'No definido';
        obs += "<br><b>SALA:</b> "+this.evento['salaAudiencia'] || 'No definido';
        break;
      case 'Consulta':
        titulo = this.evento.tipo+" - "+this.evento['referido'];
        obs += "";
        obs += "<b>NOMBRE REFERIDO:</b> "+this.evento['referido'] || 'No definido';
        obs += "<br><b>MATERIA:</b> "+this.evento['materia'] || 'No definido';
        obs += "<br><b>TELÉFONO:</b> "+this.evento['telefono'] || 'No definido';
        obs += "<br><b>CAPTADOR:</b> "+this.evento['captador'] || 'No definido';
        break;
      default:
        break;
    }
    obs += "<br><b>OBS:</b> "+desc;
    let eventCopy = {
      title: titulo,
      startTime:  new Date(this.event.startTime),
      endTime: new Date(this.event.endTime),
      allDay: this.event.allDay,
      desc: obs
    }

    if (eventCopy.allDay) {
      let start = eventCopy.startTime;
      let end = eventCopy.endTime;

      eventCopy.startTime = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      eventCopy.endTime = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1));
    }
    this.calendarService.insertar(eventCopy).subscribe(result=>{
      //console.log(result);
    })
    this.eventSource.push(eventCopy);
    this.myCal.loadEvents();
    this.resetEvent();
  }
  cambiarTipo(){
    this.evento.personal = false;
  }
  // Change current month/week/day
  next() {
    var swiper = document.querySelector('.swiper-container')['swiper'];
    swiper.slideNext();
  }

  back() {
    var swiper = document.querySelector('.swiper-container')['swiper'];
    swiper.slidePrev();
  }

  // Change between month/week/day
  changeMode(mode) {
    this.calendar.mode = mode;
  }

  // Focus today
  today() {
    this.calendar.currentDate = new Date();
  }

  // Selected date reange and hence title changed
  onViewTitleChanged(title) {
    var palabras = title.split(" ");
    //console.log(title)
    this.viewTitleNumber  = this.replaceMonth(palabras[1]);
    this.viewTitle = this.replaceMonth(palabras[0]);
  }

  // Calendar event was clicked
  async onEventSelected(event) {
     //console.log(event)
    // Use Angular date pipe for conversion
    let start = formatDate(event.startTime, 'medium', this.locale);
    let end = formatDate(event.endTime, 'medium', this.locale);

    const alert = await this.alertCtrl.create({
      header: event.title,
      subHeader: 'Desde: ' + start + ' Hasta: ' + end,
      message: event.desc,
      buttons: ['OK']
    });
    alert.present();
  }

  // Time slot was clicked
  onTimeSelected(ev) {
    let selected = new Date(ev.selectedTime);
    this.event.startTime = selected.toISOString();
    selected.setHours(selected.getHours() + 1);
    this.event.endTime = (selected.toISOString());
  }
  // replace english name with spanish name of month
  replaceMonth(month){
    return this.months[month] || month;
  }
  seleccionarCliente(){
    this.evento['nombreAtencion'] = this.clientes[this.evento.cliente].Nombre;
    this.evento['telefonoAtencion'] = this.clientes[this.evento.cliente].Telefono;
  }
  causaChange(event){

    //console.log(event);
    //console.log(this.evento.causa);
    this.clientes = [];
    this.evento['cliente'] = 0;
    for(var causa of this.evento.causa ){
      for(var cliente of causa.cliente){
        if(cliente.Nombre){
          this.clientes.push(cliente);
        }
      }
      for(var cliente of causa.clienteParte){
        if(cliente.Nombre){
          this.clientes.push(cliente);
        }
      }
    }
    this.cargandoModal = false;
  }
  abrirModal(){
    this.cargandoModal = true;
  }
  
  slicePhrase(phrase:string){
    return phrase.slice(0,8)
  }



  getEnterpriseUsers(){

    this.userService.listByEnterprise(this.enterprise,this.token).pipe(
      map((users: any[]) => users.map(user => {
        let mappedUser = {
          id: user.id,
          enterpriseId: user.enterpriseId,
          fullName: user.name+' '+ user.firstSurname,
          name: user.name,
          firstSurname: user.firstSurname,
          email : user.email,
          rol : user.rol,
          phone : user.phone,
        }
        return mappedUser;
      }))
    ).subscribe( res => {
      this.users = res;
    })
  }

  async presentModal(type:string,data?:any[]) {
    const modal = await this.modalCtrl.create({
      component: CreadorEmbebedPage,
      componentProps:{
        type: type,
        data: data,
      }
    });
    return await modal.present();
  }

  }
