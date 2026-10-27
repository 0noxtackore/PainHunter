# Informe técnico riguroso — PainHunter / Agente Mr Hunter
**Fecha:** 27/10/2026 | **Enfoque:** A (fallo técnico del entrevistador) + D (análisis completo + mejoras) | **Estado:** Diseño/Implementación

---

## 1. Resumen ejecutivo (lo que falló y por qué)

El agente **"Mr Hunter"** (`WelcomeScreen.jsx`, `useChat.js`, `chatService.js`, `openRouterService.js`) es un entrevistador laboral diseñado para operar en dos modos: **DOCUMENTACIÓN** (rol, tareas, herramientas) y **DOLOR** (obstáculos, cansancio, conflictos). Aunque el `SYSTEM_PROMPT` (`openRouterService.js` líneas 9-105) es técnico y bien estructurado, la **ejecución es frágil** y la **seguridad es crítica**. El usuario percibe un entrevistador "que falla mucho" porque:

1. **Cuando la API de OpenRouter falla** (red, límite, token), el sistema no recupera la conversación con contexto; baja a un **robot de reglas por regex** (`buildReply`) que destruye la experiencia de IA.
2. **No hay retroalimentación visual** de en qué modo está operando (documentación vs dolor), por lo que el usuario no sabe si debe hablar de su cargo o de su malestar.
3. **El contexto de conversación se trunca crudamente** (`slice(-10000)`) sin resumen estructurado, por lo que en entrevistas largas se pierde el hilo.
4. **La clave de API está expuesta al cliente** (`VITE_OPENROUTER_API_KEY`), lo que rompe cualquier promesa de confidencialidad laboral (GDPR/LPDV como menciona `improvements.md`).

---

## 2. Diagnóstico técnico por capa (A)

### 2.1 Capa de servicio de IA (`chatService.js` + `openRouterService.js`)

| Archivo / Línea | Hallazgo | Severidad |
|---|---|---|
| `chatService.js` 12-55 | `buildReply`: si no coincide regex (`hola`, `cansancio`, `dolor`, etc.), devuelve una respuesta genérica fija. Es un **fallback de reglas**, no un fallback inteligente. | Alta |
| `chatService.js` 57-79 | `sendMessage`: intenta `streamReply` 2 veces (con `sleep(600)`), y si falla totalmente, usa `buildReply`. **Nunca informa al usuario del fallo técnico real**. | Alta |
| `openRouterService.js` 2-3 | `API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY`. **La clave está en el bundle del cliente** (cualquiera puede leerla en el navegador). | Crítica |
| `openRouterService.js` 129-150 | `buildMessages`: recorta contexto con `budget = 12000` y `slice(-10000)` por tokens aproximados (`/4`). **No usa resumen ni compresión semántica**; pierdes hilos en entrevistas largas. | Media |
| `openRouterService.js` 107-127 | `buildSystemPrompt`: excelente. Define claramente modos, prohibiciones (`PROHIBIDO`), notas (`###NOTAS###`), tono y preguntas abiertas. Es la parte más fuerte del sistema. | — |

**Implicación técnica:** El prompt es de un buen expert en entrevistas laborales, pero la **infraestructura de ejecución lo anula** cuando hay problemas de red o contexto largo.

### 2.2 Capa de estado / hook (`useChat.js`)

| Archivo / Línea | Hallazgo |
|---|---|
| 176-314 | `sendMessage`: si `requestReply` falla (`catch` línea 287), muestra un mensaje genérico de error (`"Lo siento, no pude procesar..."`). **No hay botón de reintentar ni contexto de error**. |
| 98-115 | `snapshotOf`: guarda todo el objeto de conversación (mensajes, notas, conclusión, tareas, herramientas, interacciones, procesos, objetivos). Esto puede ser muy grande para Firebase. |
| 117-131 | `useEffect` de guardado: cada 1500ms guarda todas las conversaciones cambiadas. **Carga de escritura constante**. |
| 77-86 | `backfillTimer`: cada 800ms hace `backfillConversations`. Posible carga duplicada. |
| 220-258 | Al recibir tokens, actualiza mensaje por mensaje con `setConversations`. **Funciona, pero es costoso en re-renders** para streams largos. |

**Problema de UX/IA:** El usuario no ve si está en MODO DOLOR o DOCUMENTACIÓN. El sistema calcula notas (`onNotes`) y conclusiones (`requestConclusion`) en segundo plano, pero no hay un indicador visual en `App.jsx`/`ChatHeader.jsx`.

### 2.3 Capa de UI / entrevista (`WelcomeScreen.jsx`, `App.jsx`, `ChatHeader`)

- `WelcomeScreen.jsx`: las `suggestions` (líneas 7-14) son fijas y no se adaptan al `profile` (`subscribeProfile`). Podrían ser dinámicas según cargo o historial.
- No hay **indicador de modo** en la interfaz (ej. un badge: "Entrevistando rol" / "Explorando dolor"). El usuario solo lo sabe por el mensaje de Mr Hunter.
- `ChatHeader.jsx` recibe `notas`, pero no muestra el **estado activo de la entrevista** (¿se completaron tareas? ¿hay dolor detectado?).

---

## 3. Problemas de seguridad y privacidad (D — arquitectónico)

Dado que `improvements.md` menciona **GDPR/LPDV**, datos laborales y multi-tenant:

- **Exposición de API Key:** cualquier usuario puede inspeccionar `openRouterService.js` y robar la clave de OpenRouter. Esto viola confidencialidad y podría permitir acceso a los datos del modelo.
- **Datos sensibles en Firebase:** `chatStorage.js` guarda mensajes, notas y conclusiones con `uid`. No hay evidencia en este análisis de cifrado en reposo o políticas de retención.
- **Falta de proxy:** `whisperService.js` y `transcribeAudio` (`chatService.js` 81-105) llaman a `localhost:8000/api/transcribe`. Si el backend no está protegida, hay exposición adicional.
- **No hay separación de entornos:** el mismo `.env.example` podría usarse para producción si no hay control de CI/CD.

---

## 4. Recomendaciones concretas para mejorar al entrevistador (D)

### Prioridad 1 — Seguridad (hacer hoy)
1. **Mover `openRouterService.js` al backend (`server/`).** Crear un endpoint `/api/chat` que reciba mensajes, llame a OpenRouter con `API_KEY` oculta, y devuelva stream al cliente. El cliente nunca debe ver la clave.
2. Eliminar `VITE_OPENROUTER_API_KEY` de `.env` público; usar variables de servidor (`process.env.OPENROUTER_KEY`).

### Prioridad 2 — Eliminar el robot de reglas (A)
3. **Eliminar o minimizar `buildReply`.** Si `streamReply` falla 2 veces, no usar regex. Mejor: mostrar al usuario un mensaje honesto ("Tu conexión con Mr Hunter se interrumpió; reintentando...") y reintentar con el mismo contexto. Si la API está caída, ofrecer guardar y salir, no inventar respuestas.
4. **Mejorar reintento:** usar backoff exponencial (no solo `sleep(600)`) y verificar si el error es de red vs límite de token.

### Prioridad 3 — Contexto y memoria de entrevista (IA)
5. **Reemplazar `slice(-10000)` por resumen estructurado.** Cuando `conversation` supera ~8-10 mensajes, generar un `resumen` con `openRouter` y reemplazar los mensajes antiguos por el resumen + últimos 3-4 mensajes. Esto mantiene la memoria sin perder el hilo.
6. **Incluir `resumen` en el system prompt:** "Resumen de lo cubierto hasta ahora: ..." para que el modelo no pierda el modo (documentación vs dolor).

### Prioridad 4 — UX del entrevistador (UI/IA)
7. **Indicador de modo visual:** en `ChatHeader.jsx` o `App.jsx`, mostrar un badge dinámico según el contenido de la conversación (ej. si hay notas de dolor recientes → "Modo Dolor activo"; si hay tareas del rol → "Documentando rol").
8. **Adaptar `suggestions`:** usar `subscribeProfile` (`WelcomeScreen.jsx`) para sugerir preguntas relacionadas con el cargo real del usuario, no solo texto fijo.
9. **Estado de entrevista:** agregar una barra de progreso o checklist visual (¿cargo? ¿tareas? ¿herramientas? ¿dolor detectado?) para que el usuario sepa qué espera el entrevistador.

### Prioridad 5 — Mínimo producto confiable
10. **Validar notas (`###NOTAS###`):** aunque el prompt prohíbe mostrarlas, asegurarse en la UI (`Messages.jsx`) de que nunca se renderice contenido después de `###NOTAS###`. Es una capa de seguridad.
11. **Revisar `improvements.md`:** antes de escalar a B2B, implementar cifrado de mensajes, política de retención y auditoría de acceso (role-based) en Firebase.

---

## 5. Conclusión

El proyecto **PainHunter** tiene una idea sólida y un prompt de entrevistador laboral bien diseñado (`SYSTEM_PROMPT` de `openRouterService.js`). El problema no es la IA, es la **infraestructura de ejecución**: la clave expuesta, el fallback por regex y el truncamiento sin resumen destruyen la confianza del usuario. Como expertos en IU e IA, la prioridad es hacer que **Mr Hunter sea confiable, transparente y seguro** antes de escalar.

**Próximo paso recomendado:** implementar el proxy de `openRouterService.js` en `server/`, eliminar `buildReply`, y agregar el indicador de modo en `ChatHeader`. Si quieres, puedo hacer el código de esos cambios en los archivos específicos.
