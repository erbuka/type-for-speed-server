import { Component, OnInit, Input, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { IRoomInfoResponseData, ERequestType } from '../com-interface';
import { ClientService } from '../services/client.service';


@Component({
  selector: 'app-room-lobby',
  templateUrl: './room-lobby.component.html',
  styleUrls: ['./room-lobby.component.scss']
})
export class RoomLobbyComponent implements OnInit, OnDestroy, AfterViewInit {


  @Input() roomInfo: IRoomInfoResponseData = null;

  clientIdx: number[] = [];

  @ViewChild("copyLinkRef", { static: true }) private copyLinkRef: ElementRef;

  constructor(public clientService: ClientService) { }

  get emptySpots(): number[] {
    let count = this.roomInfo.size - this.roomInfo.clients.length;
    let result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(i);
    }
    return result;
  }

  get inviteLink():string{
    return `${window.location.origin}?join=${this.roomInfo.roomId}`
  }

  ngOnInit() {

  }

  ngOnDestroy() {

  }

  ngAfterViewInit() {

  }

  leaveRoom(): void {
    this.clientService.send({
      type: ERequestType.LeaveRoom,
      data: null
    });
  }

  toggleReady(): void {
    this.clientService.send({
      type: ERequestType.ToggleReady,
      data: null
    })
  }

  clientTrackBy(index: number, item: { id: string }) {
    return item.id;
  }

  copyLink():void {
    // Need to do this, the clipboard API is not standardized for now
    // and so it's not included in the Typescript Navigator interface
    (<any>navigator).clipboard.writeText(this.inviteLink);
    this.copyLinkRef.nativeElement.classList.add("tos-blip");
    setTimeout(() => this.copyLinkRef.nativeElement.classList.remove("tos-blip"), 500);
  }

}
