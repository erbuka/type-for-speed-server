import { Component, OnInit } from '@angular/core';
import { ClientService } from '../services/client.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  host: {
    "class": "tos-screen"
  }
})
export class LoginComponent implements OnInit {

  name: string;

  constructor(public client: ClientService) { }

  ngOnInit() {

  }

  connect(): void {
    this.client.connect();
  }

  fbConnect(): void { 
    this.client.connectWithFacebook();
  }

}
