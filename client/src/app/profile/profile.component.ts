import { Component, OnInit, OnDestroy } from '@angular/core';
import { ClientService } from '../services/client.service';
import { ContextService, EAppScreen } from '../services/context.service';
import { IResponse, EResponseType, ERequestType, namePattern } from '../com-interface';
import { Unsubscribable } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private _selectedDisplayName: string = null;
  private _selectedColor: string = null;

  private _subscription: Unsubscribable = null;

  set selectedDisplayName(s: string) { this._selectedDisplayName = s; }
  get selectedDisplayName(): string { return this._selectedDisplayName; }

  get selectedColor(): string { return this._selectedColor; }
  set selectedColor(c: string) { this._selectedColor = c; }
  constructor(public clientService: ClientService, public context: ContextService) { }

  ngOnInit() {
    this._selectedDisplayName = this.clientService.name;
    this._selectedColor = this.clientService.color;
    this._subscription = this.clientService.subscribe((r: IResponse) => {
      if (r.type === EResponseType.ProfileUpdated) {
        this.context.gotoScreenAsync(EAppScreen.MainMenu);
      }
    });
  }

  ngOnDestroy() {
    if (this._subscription)
      this._subscription.unsubscribe();
  }

  saveProfile() {

    if(!(this.isDisplayNameValid()))
      return;

    this.clientService.send({
      type: ERequestType.UpdateProfile,
      data: {
        displayName : this.selectedDisplayName.trim(),
        color: this.selectedColor
      }
    })
  }

  isDisplayNameValid():boolean {
    return namePattern.test(this._selectedDisplayName.trim());
  }

}
