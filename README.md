# Noche de Salamanca: Tierra Adentro

RPG de mundo abierto con los personajes y las leyendas de [Noche de Salamanca](https://github.com/ElMPL/noche-de-salamanca). Mandinga abrió la Salamanca y las leyendas andan sueltas por todo el país: hay que juntar las 8 reliquias de los jefes para poder entrar a la cueva y cerrarla.

- **14 personajes**, cada uno con su ataque y 3 habilidades que se aprenden subiendo de nivel.
- **9 territorios** en un solo mapa: La Pampa, los Esteros del Iberá, El Impenetrable, El Ingenio, la Selva Misionera, Cuyo, la Puna, la Patagonia y la Salamanca.
- **8 pueblos** con fogón (descansar, guardar y viajar), pulpería, herrería y gente con misiones.
- **Más de 300 campamentos de bichos**, campeones dorados, 9 jefes, santuarios del Gauchito Gil, entierros que se cavan de noche y día y noche que cambian el mundo.
- **Mundo compartido**: hasta 12 personas en el mismo mundo, con chat. También se juega solo y sin internet.

## Cómo se juega
- **Compu:** WASD para moverte, el mouse apunta, clic ataca, Q E R habilidades, Espacio esquiva, H toma mate, F habla, M mapa, I inventario, L misiones, Enter chat.
- **Celular:** joystick a la izquierda y botones a la derecha.
- **Joystick de consola:** A ataca, X / RB / RT habilidades, B esquiva, Y habla.

El personaje se guarda en el dispositivo y es el mismo en el mundo compartido y jugando solo.

## Cómo está armado
- `shared/`: lo que comparten el servidor y el juego. `mapa.js` arma el mundo (territorios, ríos, caminos, pueblos, campamentos y obstáculos) a partir de semillas fijas, así nadie tiene que mandar el mapa por la red. `sim.js` es el mundo vivo: bichos, jefes y la hora. `reglas.js` tiene personajes, habilidades, niveles y objetos.
- `src/nube.js`: el mundo compartido sobre Firebase Realtime Database. No hay un servidor prendido: una de las pantallas que están jugando hace de anfitrión y corre el mundo (igual que jugando solo), y los mensajes van y vienen por la base de datos. Si el anfitrión se va o se le cuelga el juego, otra pantalla toma su lugar sola.
- `server/server.js`: un servidor propio, por si algún día se quiere usar en vez de Firebase (y para probar en la compu). No usa paquetes de afuera.
- `src/`: el juego en la pantalla (three.js). `lib/` son los modelos 3D, el sonido y los datos de Noche de Salamanca.
- `docs/`: el juego compilado (`npm install` y después `npm run build`). Lo publica GitHub Pages y lo abre la app de Android.
- `android/`: la app. Se compila con `android/build.sh` en GitHub Actions y se firma con los secretos `KS_B64` y `KS_PASS`.

Cada jugador maneja su personaje y su vida en su pantalla; el que corre el mundo decide dónde están los bichos y anuncia cada ataque con tiempo, y cada pantalla se fija si su jugador quedó adentro cuando pega.

## Publicarlo
1. **El juego:** GitHub Pages desde `main`, carpeta `/docs`.
2. **El mundo compartido:** un proyecto de [Firebase](https://console.firebase.google.com) con **Realtime Database** (alcanza el plan gratis, que no pide tarjeta). En la pestaña *Reglas* de la base se pegan las de `database.rules.json`. Después se pone la dirección de la base en `FIREBASE` de `src/red.js` y se vuelve a compilar. El plan gratis permite 100 conexiones a la vez y 10 GB de datos por mes: cada jugador gasta entre 20 y 50 MB por hora, así que alcanza para unas 200 horas de juego por mes sumando a todos.
3. **La app de Android:** cada cambio en `android/` publica un APK nuevo en *Releases*.

## Probar en la compu
```
npm install
npm run build
npm start
```
Y abrir http://localhost:8080. Para probar el mundo compartido sin Firebase, abrir http://localhost:8080/?prueba en dos pestañas (usa una base de datos de mentira entre pestañas del mismo navegador); con `?ws` se usa el servidor propio.
