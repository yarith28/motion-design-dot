import {mountRoom} from "../journey/journey.mjs";
import {engines} from "./engines.mjs";
const games=await(await fetch("./games.json")).json();
mountRoom({games,engines,title:'THE COMMONS / CHOICES WE SHARE'});
