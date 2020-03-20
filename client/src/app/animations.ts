import {
    trigger,
    state,
    style,
    animate,
    transition,
    // ...
} from '@angular/animations';

const slideTime = "0.2s";
const slideOffset = "100px";
const fadeTime = "0.2s";

export const animations = {
    slide : trigger("slide",[
        transition(":enter", [
            style({ opacity: 0, left:  slideOffset }),
            animate(slideTime, style({ opacity : 1, left: 0 }))
        ]),
        transition(":leave", [
            style({ opacity: 1, left: 0 }),
            animate(slideTime, style({ opacity : 0, left: `-${slideOffset}` }))
        ])  
    ]),
    fade : trigger("fade",[
        transition(":enter", [
            style({ opacity: 0 }),
            animate(fadeTime, style({ opacity : 1 }))
        ]),
        transition(":leave", [
            style({ opacity: 1, left: 0 }),
            animate(fadeTime, style({ opacity : 0 }))
        ])  
    ]),
}
