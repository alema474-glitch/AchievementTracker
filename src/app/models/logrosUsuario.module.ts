export class LogrosUsuario {
  constructor(
    public idUser: string,
    public idJuego: string,
    public idAchievement: string,
    public conseguido: boolean = true
  ) {}
}
