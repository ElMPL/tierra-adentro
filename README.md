# Noche de Salamanca: Tierra Adentro

RPG de mundo abierto con los personajes y las leyendas de [Noche de Salamanca](https://github.com/ElMPL/noche-de-salamanca). Mandinga abrió la Salamanca y las leyendas andan sueltas por todo el país: hay que juntar las 8 reliquias de los jefes para poder entrar a la cueva y cerrarla.

- **14 personajes**, cada uno con su ataque y 3 habilidades que se aprenden subiendo de nivel.
- **9 territorios** en un solo mapa: La Pampa, los Esteros del Iberá, El Impenetrable, El Ingenio, la Selva Misionera, Cuyo, la Puna, la Patagonia y la Salamanca.
- **8 pueblos** con fogón (descansar, guardar y viajar), pulpería, herrería y gente con misiones.
- **Más de 300 campamentos de bichos**, campeones dorados, 9 jefes, santuarios del Gauchito Gil, entierros que se cavan de noche y día y noche que cambian el mundo.
- **Mundo compartido**: hasta 16 personas en el mismo mundo, con chat. También se juega solo y sin internet.

## Cómo se juega
- **Compu:** WASD para moverte, el mouse apunta, clic ataca, Q E R habilidades, Espacio esquiva, H toma mate, F habla, M mapa, I inventario, L misiones, Enter chat.
- **Celular:** joystick a la izquierda y botones a la derecha.
- **Joystick de consola:** A ataca, X / RB / RT habilidades, B esquiva, Y habla.

El personaje se guarda en el dispositivo y es el mismo en el mundo compartido y jugando solo.

## Cómo está armado
- `shared/`: lo que comparten el servidor y el juego. `mapa.js` arma el mundo (territorios, ríos, caminos, pueblos, campamentos y obstáculos) a partir de semillas fijas, así nadie tiene que mandar el mapa por la red. `sim.js` es el mundo vivo: bichos, jefes y la hora. `reglas.js` tiene personajes, habilidades, niveles y objetos.
- `server/server.js`: el servidor del mundo compartido. No usa paquetes de afuera.
- `src/`: el juego en la pantalla (three.js). `lib/` son los modelos 3D, el sonido y los datos de Noche de Salamanca.
- `docs/`: el juego compilado (`npm install` y después `npm run build`). Lo publica GitHub Pages y lo abre la app de Android.
- `android/`: la app. Se compila con `android/build.sh` en GitHub Actions y se firma con los secretos `KS_B64` y `KS_PASS`.

Cada jugador maneja su personaje y su vida en su pantalla; el servidor decide dónde están los bichos y anuncia cada ataque con tiempo, y cada pantalla se fija si su jugador quedó adentro cuando pega.

## Publicarlo
1. **El juego:** GitHub Pages desde `main`, carpeta `/docs`.
2. **El mundo compartido:** en Render, *New > Blueprint* con este repo (usa `render.yaml`). Después poner la dirección en `SERVIDOR` de `src/red.js` y volver a compilar. El plan gratis duerme el servidor si nadie juega por 15 minutos; el primero que entra espera hasta un minuto a que se despierte.
3. **La app de Android:** cada cambio en `android/` publica un APK nuevo en *Releases*.

## Probar en la compu
```
npm install
npm run build
npm start
```
Y abrir http://localhost:8080 (en dos pestañas para probar con dos jugadores).
