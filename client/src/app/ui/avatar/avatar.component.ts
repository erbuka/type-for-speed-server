import { Component, OnInit, Input, HostBinding, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit {

  @Input() @HostBinding("style.width.px") @HostBinding("style.height.px") @HostBinding("style.line-height.px") size: number = 48;
  @Input() name: string = null;
  @Input() url: string = null;
  @Input() @HostBinding("style.background-color") color: string = "#000";

  avatarURL: string = null;

  get initials(): string {
    let split = this.name.split(/\s+/);
    return split.length < 2 ?
      split[0].substr(0, 2) :
      split[0].charAt(0) + split[1].charAt(0);
  }

  constructor() { }


  ngOnInit() {
    if (this.url) {
      let img = new Image();

      img.addEventListener("load", () => {
        this.avatarURL = this.url;
      });
      img.src = this.url;

    }
  }


}
