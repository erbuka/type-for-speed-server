import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { IRequest, ERequestType, IConnectedResponseData, EResponseType, IResponse, IProfile, IProfileUpdatedResponseData } from '../com-interface';
import { Unsubscribable } from 'rxjs';

declare var FB;

type ClientServiceListener = (IResponse) => void;

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  get id(): string { return this._id; }
  get name(): string { return this.connected ? this._profile.displayName : null; }
  get avatar(): string { return this.connected ? this._profile.avatar : null; }
  get color(): string { return this.connected ? this._profile.color : null; }
  get connected(): boolean { return this._socket && this._socket.readyState === WebSocket.OPEN && this._profile !== null; }

  get colorPalette(): string[] { return this._colorPalette; }

  private _socket: WebSocket = null;
  private _id: string = null;
  private _listeners: Set<ClientServiceListener> = new Set();

  private _profile: IProfile = null;
  private _colorPalette: string[] = null;

  private _heartbeatInterval = null;

  constructor(private _httpClient: HttpClient) { }

  initialize(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      window['fbAsyncInit'] = function () {
        FB.init({
          appId: '757798571231426',
          cookie: true,  // enable cookies to allow the server to access the session
          xfbml: true,  // parse social plugins on this page
          version: 'v3.2' // use graph api version 3.2
        });
        resolve();
      };

      (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.onerror = reject;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    });
  }

  subscribe(listener: ClientServiceListener): Unsubscribable {
    this._listeners.add(listener);
    return {
      unsubscribe: () => this._listeners.delete(listener)
    }
  }

  connect(facebookId: string = null, avatar: string = null): void {

    this._id = null;
    this._profile = null;
    this._socket = new WebSocket(environment.serverEndPoint);
    this._socket.addEventListener("close", this.onClose.bind(this));
    this._socket.addEventListener("error", this.onError.bind(this));
    this._socket.addEventListener("message", this.onMessage.bind(this));
    this._socket.addEventListener("open", () => {
      this.send({
        type: ERequestType.Connect,
        data: {
          facebookId: facebookId,
          avatar: avatar
        }
      });
    });

  }


  async autoConnectWithFacebook(): Promise<boolean> {

    let connected = await this.fbIsConnected();

    if (connected) {
      let profile = await this.fbGraph("/me", { fields: "id,first_name" });
      let picture = await this.fbGraph("/me/picture", { redirect: 0, type: "normal" });
      this.connect(profile.id, picture.data.url);
      return true;
    } else {
      return false;
    }
  }

  async connectWithFacebook(): Promise<void> {
    await this.fbLogin();
    let profile = await this.fbGraph("/me", { fields: "id,first_name" });
    let picture = await this.fbGraph("/me/picture", { redirect: 0, type: "normal" });
    this.connect(profile.id, picture.data.url);
  }


  async disconnect(): Promise<void> {
    if (this._socket) {
      try { await this.fbLogout(); }
      catch (e) { }
      this._socket.close();
      this._socket = null;
      this.fireOnMessage({
        type: EResponseType.Disconnected,
        data: null
      });
    }
  }

  send(request: IRequest): void {
    this._socket.send(JSON.stringify(request));
  }

  private onClose(evt: CloseEvent): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    if (!evt.wasClean) {
      this.fireOnMessage({
        type: EResponseType.Error,
        data: {
          requestType: ERequestType.Unknown,
          description: "The connection was unexpectedly reset."
        }
      });
    }
  }

  private onError(evt: Event): void {
    this.fireOnMessage({
      type: EResponseType.Error,
      data: {
        requestType: ERequestType.Unknown,
        description: "Test error"
      }
    });
  }


  private onMessage(evt: MessageEvent): void {
    let response: IResponse = JSON.parse(evt.data);

    switch (response.type) {
      case EResponseType.ProfileUpdated:
        {
          let data = <IProfileUpdatedResponseData>response.data;
          for(let k in data) {
            this._profile[k] = data[k];
          }
        }
        break;
      case EResponseType.Connected:
        {
          let data = <IConnectedResponseData>response.data;
          this._id = data.id;
          this._profile = data.profile;
          this._colorPalette = data.colorPalette;

          if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
          }
          this._heartbeatInterval = setInterval(() => {
            this.send({
              type: ERequestType.Heartbeat,
              data: null
            });
          }, 5000);
        }

        break;
    }

    this.fireOnMessage(response);

  }

  private fireOnMessage(request: IResponse) {
    this._listeners.forEach(l => l(request));
  }

  private fbGraph(url: string, params: object = {}): Promise<any> {
    return new Promise<object>((resolve, reject) => {
      FB.api(url, params, (response) => {
        resolve(response);
      });
    });
  }

  private fbIsConnected(): Promise<boolean> {
    if (!FB)
      return Promise.resolve(false);

    return new Promise<boolean>((resolve, reject) => {
      FB.getLoginStatus((response) => {
        resolve(response.status === "connected");
      })
    });
  }

  private fbLogout(): Promise<void> {
    if (!FB)
      return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.fbIsConnected().then((connected) => {
        connected ? FB.logout(() => resolve()) : resolve();
      });
    });
  }

  private fbLogin(): Promise<void> {
    return new Promise((resolve, reject) => {
      FB.getLoginStatus((response) => {
        if (response.status === "connected") {
          resolve();
        } else {
          FB.login((response) => {
            if (response.status === "connected") {
              resolve();
            } else {
              reject();
            }
          }, { scope: 'public_profile' });
        }
      })
    });
  }

}
