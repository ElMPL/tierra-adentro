# Noche de Salamanca: Tierra Adentro

RPG de mundo abierto con los personajes y las leyendas de [Noche de Salamanca](https://github.com/ElMPL/noche-de-salamanca). Mandinga abrió la Salamanca y las leyendas andan sueltas por todo el país: hay que juntar las 8 reliquias de los jefes para poder entrar a la cueva y cerrarla.

- **14 personajes**, cada uno con su ataque y 3 habilidades que se aprenden subiendo de nivel.
- **9 territorios** en un mapa chico y lleno (todo queda a menos de un minuto de caminata): La Pampa, los Esteros del Iberá, El Impenetrable, El Ingenio, la Selva Misionera, Cuyo, la Puna, la Patagonia y la Salamanca. Cada territorio se divide en **parajes con nombre y nivel** (48 en total, como las Lomas del Tala, la Laguna Iberá o las Salinas Grandes) que se anuncian al entrar y se anotan en el mapa.
- **Relieve**: llanura en la pampa, esteros bajos, la puna alta, mesetas escalonadas en la Patagonia y sierras entre territorios, con abras donde pasan los caminos y carteles en cada límite. Los ríos van por el fondo de sus valles. Hay cerros que se ven de lejos (el de los Siete Colores, con sus franjas pintadas, la Sierra de la Ventana, el Uritorco y el Champaquí), un salar blanco, la Salamanca metida en un cráter con una sola entrada y las cataratas donde el Paraná se cae de la selva, con neblina y arcoíris. Lo muy empinado no se sube caminando (la vicuña sí trepa).
- **Historia en ocho capítulos**: cada pueblo tiene gente con nombre y su propia leyenda que explica por qué el jefe de ese territorio se quedó con una reliquia (el séptimo hijo de los Arrieta que se volvió lobizón, los huevos robados de Mbói Tu’ĩ, el contrato del patrón del ingenio, Naipí y Tarobá en la Garganta del Diablo, la Difunta Correa, el carnaval que no se quiere enterrar, el kultrún de la machi). Las misiones son variadas (hablar con alguien en otro pueblo, ir a un lugar, buscar cosas en el mundo, hacer algo en un santuario, acompañar a alguien perdido hasta su casa, juntar lo que sueltan los bichos) y un diario cuenta lo que te pasó. Un forastero de poncho negro te ofrece tratos después de cada jefe: lo que le aceptes cambia el final.
- **Un mundo que se mueve**: gente que va y viene por los caminos (jinetes, carretas, arrieros con su tropa, pastoras con sus vicuñas) y te saluda al pasar, vecinos que te comentan cosas, bandadas de pájaros según el lugar (cóndores en la cordillera, garzas en los esteros, loros en la selva), mariposas y panaderos.
- **8 pueblos vivos** con fogón (descansar, guardar y viajar), pulpería, herrería, aljibe y gente con misiones. Los vecinos pasean, de noche se juntan al fogón, los perros te siguen y cada uno tiene un rumor que esconde una pista.
- **126 campamentos de bichos**, campeones dorados, 9 jefes, santuarios del Gauchito Gil, entierros que se cavan de noche y día y noche que cambian el mundo.
- **Cosas que pasan solas**: tormentas con rayos (que también les pegan a los bichos) y tornados que te levantan, la Luz Mala que se escapa y se hunde donde hay un entierro, malones que atacan los pueblos en tres oleadas, lluvias de estrellas para pedir deseos, luces raras en el cielo que se llevan a la gente a pasear y la carreta de un mercachifle que recorre los caminos.
- **Animales y caballos**: vacas, ovejas, vicuñas y baguales sueltos. Un bagual se doma con un minijuego y después es tu caballo: lo llamás con un silbido y galopás casi al doble de rápido.
- **Sorpresas**: de una tinaja puede salir un duende que te roba la plata (si lo alcanzás te la devuelve doble) y entre las cortaderas y las cañas hay patacones perdidos.
- **Progresión**: 15 mañas en tres ramas (Coraje, Aguante y Baqueano), con cinco rangos cada una. Se ganan subiendo de nivel, con la fama (siete títulos, de Forastero a Leyenda viva, que además te hacen descuento en los pueblos), explorando el mapa (que arranca a oscuras), volteando diez de cada leyenda y pescando.
- **Ocho monturas**, cada una con su habilidad en Espacio: caballo criollo, toro y vicuña se doman en el campo; el yacaré (nada), la Mula Ánima (deja fuego), El Familiar, el yaguareté y el cóndor (vuela por arriba de todo) se ganan venciendo a los jefes.
- **Pesca** en ríos y lagunas, con un minijuego para pelear al pez, doce especies según el territorio y cofres en el fondo.
- **Tres cámaras**: desde arriba, desde atrás o en primera persona.
- **Mundo compartido**: hasta 12 personas en el mismo mundo, con chat. También se juega solo y sin internet.

## Cómo se juega
- **Compu:** WASD para moverte, el mouse apunta, clic ataca, Q E R habilidades, Espacio esquiva, H toma mate, F habla, G llama o baja de la montura (arriba de ella, Espacio usa su habilidad), V cambia la cámara, P progreso (mañas, monturas y logros), M mapa, I inventario, L misiones y diario, Enter chat. Desde atrás y en primera persona, un clic traba el mouse para mirar (Esc lo suelta).
- **Celular:** joystick a la izquierda y botones a la derecha. Desde atrás y en primera persona, arrastrar el dedo en la mitad derecha mueve la vista.
- **Joystick de consola:** A ataca, X / RB / RT habilidades, B esquiva, Y habla, la palanca derecha mira, apretar la palanca izquierda llama al caballo y la derecha cambia la cámara.

El personaje se guarda en el dispositivo y es el mismo en el mundo compartido y jugando solo.

## Cómo está armado
- `shared/`: lo que comparten el servidor y el juego. `mapa.js` arma el mundo (territorios, parajes, relieve, ríos, caminos, pueblos, campamentos y obstáculos) a partir de semillas fijas, así nadie tiene que mandar el mapa por la red. `sim.js` es el mundo vivo: bichos, jefes, la hora y los eventos (tormentas, Luz Mala, malones, estrellas, ovni y carreta). `reglas.js` tiene personajes, habilidades, niveles y objetos.
- `src/nube.js`: el mundo compartido sobre Firebase Realtime Database. No hay un servidor prendido: una de las pantallas que están jugando hace de anfitrión y corre el mundo (igual que jugando solo), y los mensajes van y vienen por la base de datos. Si el anfitrión se va o se le cuelga el juego, otra pantalla toma su lugar sola.
- `server/server.js`: un servidor propio, por si algún día se quiere usar en vez de Firebase (y para probar en la compu). No usa paquetes de afuera.
- `src/`: el juego en la pantalla (three.js). `historia.js` tiene los capítulos, la gente con nombre y los tratos del forastero; `misiones.js` cómo avanzan las misiones y las charlas; `ambiente.js` los viajeros, los pájaros, la neblina de las cataratas y los carteles. `progreso.js` tiene las mañas, la fama y la exploración, `pesca.js` la pesca y `vida.js` lo que pasa solo en tu pantalla (animales, la doma, las monturas, la gente y los perros de los pueblos) y `eventos.js` dibuja los eventos del mundo y se fija si los tocás. `lib/` son los modelos 3D, el sonido y los datos de Noche de Salamanca.
- `docs/`: el juego compilado (`npm install` y después `npm run build`). Lo publica GitHub Pages y lo abre la app de Android.
- `android/`: la app. Se compila con `android/build.sh` en GitHub Actions y se firma con los secretos `KS_B64` y `KS_PASS`.

Cada jugador maneja su personaje y su vida en su pantalla; el que corre el mundo decide dónde están los bichos y anuncia cada ataque con tiempo, y cada pantalla se fija si su jugador quedó adentro cuando pega.

## Publicarlo
1. **El juego:** GitHub Pages desde `main`, carpeta `/docs`.
2. **El mundo compartido:** un proyecto de [Firebase](https://console.firebase.google.com) con **Realtime Database** (alcanza el plan gratis, que no pide tarjeta). En la pestaña *Reglas* de la base se pegan las de `database.rules.json`. Después se pone la dirección de la base en `FIREBASE` de `src/red.js` y se vuelve a compilar. El plan gratis permite 100 conexiones a la vez y 10 GB de datos por mes: cada jugador gasta entre 25 y 45 MB por hora (el tipo de cada bicho se manda solo cuando aparece), así que alcanza para unas 250 horas de juego por mes sumando a todos.
3. **La app de Android:** cada cambio en `android/` publica un APK nuevo en *Releases*.

## Probar en la compu
```
npm install
npm run build
npm start
```
Y abrir http://localhost:8080. Para probar el mundo compartido sin Firebase, abrir http://localhost:8080/?prueba en dos pestañas (usa una base de datos de mentira entre pestañas del mismo navegador); con `?ws` se usa el servidor propio.
