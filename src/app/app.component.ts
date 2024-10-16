import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DndDraggableDirective,
  DndDragImageRefDirective,
  DndDropEvent,
  DndDropzoneDirective,
  DndHandleDirective,
  DndPlaceholderRefDirective,
} from 'ngx-drag-drop';

export interface Actor {
  id: string;
  name: string;
  color: string;
  roles: Role[];
  isEditMode: boolean;
}

export interface Role {
  roleName: string;
  relations: string;
  isRelationError: boolean;
}

export interface List {
  actors: Actor[];
  colors: string[];
  listName: string;
}

let COLORS: string[] = [
  '#FF5733',  // Red-Orange
  '#33FFBD',  // Mint Green
  '#5d70e7',  // Blue
  '#FF33A8',  // Pink
  '#33FF57',  // Lime Green
  '#F39C12',  // Amber
  '#8E44AD',  // Purple
  '#16A085',  // Teal
  '#C0392B',  // Dark Red
  '#2980B9'   // Sky Blue
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgForOf, FormsModule, NgIf, DndDropzoneDirective, DndPlaceholderRefDirective, DndDraggableDirective, DndHandleDirective, DndDragImageRefDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild('nameInput', { static: false }) nameInput: ElementRef | undefined;

  public actors: Actor[] = []
  public isSaveMode: boolean = false;
  public savedList: List[] = [];
  public showedSavedList: boolean = false;

  public ngOnInit(): void {
    this.savedList = JSON.parse(localStorage.getItem('savedList') || '[]');
    this.actors = JSON.parse(window.localStorage.getItem('actors') || '[]');
    COLORS = JSON.parse(window.localStorage.getItem('colors') || JSON.stringify(COLORS));
  }

  public addNewActor(input: HTMLInputElement): void {
    this.actors.push(
      {
        id: this.generateUniqueId(),
        name: input.value,
        color: COLORS.splice(0, 1)[0],
        roles: [],
        isEditMode: false
      }
    );
    input.value = '';

    this.saveToStorage();
  }

  public editActor(actor: Actor): void {
    actor.isEditMode = !actor.isEditMode;

    if (!actor.isEditMode) {
      setTimeout(() => this.nameInput?.nativeElement.focus(), 0);

      this.saveToStorage();
    }
  }

  public setRole(actor: Actor, input: HTMLInputElement): void {
    actor.roles.push({roleName: input.value, relations: '', isRelationError: false});
    input.value = '';

    this.saveToStorage();
  }

  public reset(): void {
    window.localStorage.removeItem('actors');
    window.localStorage.removeItem('colors');
    window.location.reload();
  }

  public removeActor(id: string): void {
    const index = this.actors.findIndex(actor => actor.id === id);

    if (index !== -1) {
      this.actors[index].color ? COLORS.push(this.actors[index].color) : false;
      this.actors.splice(index, 1);
    }

    this.saveToStorage();
  }

  public removeRole(actor: Actor, role: Role): void {
    const index = actor.roles.findIndex(item => item.roleName === role.roleName);

    if (index !== -1) {
      actor.roles.splice(index, 1);
    }

    this.saveToStorage();
  }

  public saveList(key?: string): void {
    if (key) {
      this.isSaveMode = !this.isSaveMode;
      this.savedList = JSON.parse(window.localStorage.getItem('savedList') || '[]');
      this.savedList.push({
        actors: this.actors,
        colors: COLORS,
        listName: key
      });
    }

    window.localStorage.setItem('savedList', JSON.stringify(this.savedList));
  }

  public load(index: number): void {
    this.actors = [...this.savedList[index].actors];
    COLORS = [...this.savedList[index].colors];

    this.saveToStorage();
  }

  public calculateRelations(actor: Actor): void {
    let roleValues = actor.roles.map(role => role.roleName);

    actor.roles.forEach(item => {
      if (item.relations.length > 0) {
        let relations = item.relations.split(',');

        item.isRelationError = relations.some(relation => roleValues.includes(relation.trim()));
      } else {
        item.isRelationError = false;
      }
    })

    this.saveToStorage();
  }

  public onDrop(event: DndDropEvent, actor: Actor, role: Role): void {
    let roleName: string = event.data;
    let textArea = event.event.target as HTMLTextAreaElement;
    let textAreaValues: string[] = textArea.value.split(',');
    textAreaValues[0] === '' ? textAreaValues[0] = roleName : textAreaValues.push(roleName);
    textArea.value = textAreaValues.toString();
    role.relations = role.relations.length === 0 ? role.relations + roleName : role.relations + `,` + roleName;

    this.calculateRelations(actor);
  }

  public removeListElement(index: number): void {
    this.savedList.splice(index, 1);
    this.saveList();
  }

  private saveToStorage(): void {
    window.localStorage.setItem('actors', JSON.stringify(this.actors));
    window.localStorage.setItem('colors', JSON.stringify(COLORS));
  }

  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36); // Convert current time to base 36
    const randomString = Math.random().toString(36).substring(2, 8); // Generate a random string

    return `${timestamp}-${randomString}`; // Combine timestamp and random string
  }
}
