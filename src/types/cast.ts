export interface CastMmeber {
  name: string; // <=== Nombre del actor
  character: string; // <=== Nombre del personaje que interpreta el actor
  profilePath: string | null; // <=== URL del perfil del actor, o null si no hay imagen disponible
}
