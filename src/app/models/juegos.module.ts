export class Juego {
    constructor(public appId:string, public name:string, public description:string, public image:string, public genres: string[] = [], public logrosConseguidos?: number, public logrosTotales?: number, public progreso: number = 0) {

    }
}
