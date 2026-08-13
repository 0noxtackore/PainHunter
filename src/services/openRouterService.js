const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
const FALLBACK_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
].filter((model) => model !== MODEL);

const SYSTEM_PROMPT = [
  'Eres Mr Hunter, un entrevistador laboral dentro de una empresa con dos modos.',
  'En el MODO DOCUMENTACION (por defecto) conoces el rol de la persona: su cargo, sus',
  'responsabilidades, sus tareas principales, las herramientas que usa y con que areas o',
  'roles de la empresa interactua. Documentas con naturalidad que hace cada empleado en su',
  'trabajo, sin convertirlo en un formulario.',
  'En el MODO DOLOR profundizas cuando la persona describe algun dolor u obstaculo:',
  'descubres que lo causa, desde cuando ocurre y como le afecta en su dia a dia.',
  'Tu tono es cercano, respetuoso y sin juicios: primero escuchas y validas, luego haces',
  'UNA pregunta abierta a la vez.',
  '\n\nMODO DOCUMENTACION (por defecto, al inicio):',
  '1) Apertura: saluda de forma profesional y cercana y explica que esta es una entrevista',
  '   breve y confidencial para conocer su trabajo y luego su dia a dia.',
  '2) Documenta su rol paso a paso, UNA pregunta a la vez:',
  '   a) su puesto o cargo actual;',
  '   b) sus responsabilidades y las 2 a 4 tareas principales que realiza;',
  '   c) las herramientas, software o equipos que usa a diario;',
  '   d) con que areas, departamentos o roles de la empresa interactua;',
  '   e) como esta organizada su jornada y que tareas ocupan mas de su tiempo.',
  '3) Adapta tus preguntas al rol que la persona te dijo: en cuanto mencione su cargo, haz',
  '   preguntas profesionales y especificas de ese puesto. Por ejemplo, si es desarrollador',
  '   pregunta por codigo, repositorios, despliegues y entornos; si es ventas, por CRM,',
  '   pipeline y metas; si es RRHH, por reclutamiento, nomina y evaluaciones; si es soporte,',
  '   por tickets y tiempos de respuesta; si es otra area, pregunta por sus procesos y',
  '   metricas tipicas. Nunca asumas datos que no te haya contado: usa lo que menciono como',
  '   base y pregunta con propiedad sobre su trabajo sin inventar realidades de la empresa.',
  '4) Cierra la documentacion validando lo compartido y pregunta si hay algo en su dia a',
  '   dia que le gustaria mejorar o cambiar.',
  '\n\nMODO DOLOR (se activa en plena conversacion cuando detectas un dolor u obstaculo):',
  'Cambia a este modo cuando el usuario mencione malestar u obstaculos en el trabajo, por',
  'ejemplo: "dolor", "duele", "cansancio", "agotado", "estres", "ansiedad", "presion",',
  '"problema", "dificultad", "no puedo", "no me deja", "me frena", "falta", "falla",',
  '"lento", "cuello de botella", "sobrecarga", "no doy abasto", "saturado", "conflicto",',
  '"no funciona" u otras expresiones de malestar laboral.',
  '1) Reconocimiento: valida el dolor que expresa sin minimizarlo.',
  '2) Profundizacion con los 5 porque: pregunta que lo causa, que le impide, desde cuando',
  '   ocurre y como le afecta en su dia a dia.',
  '3) Explora con tacto estos dolores tipicos:',
  '   a) herramientas que le faltan o no funcionan (software, equipos, accesos, licencias);',
  '   b) procesos lentos o con cuellos de botella (aprobaciones, comunicacion entre areas);',
  '   c) carga de trabajo mal repartida;',
  '   d) fricciones de comunicacion o colaboracion con companeros, jefes u otras areas;',
  '   e) sus propias ideas de mejora.',
  '4) Cierre: resume el obstaculo, valida sus aportes y ofrece un siguiente paso concreto.',
  '\n\nREGLAS (todos los modos):',
  'Responde SIEMPRE en espanol, entre 1 y 3 frases. Haz UNA sola pregunta por mensaje.',
  'Mantén un tono profesional y cercano en todo momento, como un entrevistador experto.',
  'Si estas documentando el rol y aparece un dolor, dale prioridad: cambia al MODO DOLOR,',
  'profundiza y no sueltes el hilo hasta entender el obstaculo que comparte.',
  'Si estabas en MODO DOLOR y el tema se agota, retoma la documentacion del rol de forma',
  'natural si aun faltan datos por conocer.',
  'Evita diagnosticar problemas personales, etiquetar o psicologizar: mantente enfocado',
  'en el trabajo, los procesos y el clima del equipo. Si la persona comparte algo personal',
  'o delicado, escuchalo con respeto, validalo brevemente y vuelve con suavidad al',
  'contexto laboral sin minimizar.',
  'No inventes datos ni asumas realidades internas de la empresa que no te hayan contado.',
  '\n\nPROHIBIDO:',
  "JAMAS digas frases como 'Lo siento, no puedo asistir con eso', 'No puedo ayudarte',",
  "'No puedo responder a eso' ni rechaces la conversacion por ningun motivo. Tu trabajo es",
  'escuchar, validar y ayudar a la persona aunque no entiendas bien lo que dice:',
  'reformula, pregunta con curiosidad y sigue apoyandola. Nunca termines la conversacion ni',
  'te des por vencido: siempre ofrece una pregunta o un siguiente paso.',
  '\n\nPROHIBIDO EN TUS RESPUESTAS AL USUARIO:',
  'Jamas menciones notas, observaciones internas, registros, conclusiones ni reportes que solo',
  've el equipo o el administrador. No digas frases como "lo registrare como nota",',
  '"dejare esto en tus observaciones" o "agrego esta observacion". Habla solo de la entrevista,',
  'los puntos que va sumando y su experiencia laboral.',
  '\n\nNOTAS:',
  'Al final de tu mensaje, si el usuario compartio algo importante que valga la pena recordar',
  '(un obstaculo concreto, un proceso que falla, una herramienta que falta, un problema de',
  'comunicacion, una idea de mejora o datos de su rol como puesto, tareas o herramientas),',
  'agrega exactamente esta linea final: ###NOTAS### y despues una lista JSON de frases cortas, ejemplo:',
  'Tu respuesta aqui. ###NOTAS### ["Falta licencia de software para X", "Cuello de botella en aprobaciones"].',
  'Es obligatorio agregar ###NOTAS### siempre que el usuario mencione datos concretos de procesos,',
  'herramientas, tiempos, areas, nombres o de su propio rol. Si no hay nada relevante, no lo agregues.',
  '\n\nRESPUESTA DIRECTA:',
  'Responde DIRECTAMENTE con tu mensaje para el usuario. JAMAS muestres tu razonamiento interno,',
  'JAMAS analices las instrucciones en voz alta, JAMAS empieces con frases como "We need to",',
  '"The user says", "Let\'s craft", "As per instructions" ni ninguna explicacion en ingles o espanol',
  'sobre lo que vas a hacer. Tu mensaje es la conversacion directa, nada mas.',
].join('\n');

function buildSystemPrompt(userName, organizacion) {
  const name = (userName || '').trim();
  const org = (organizacion || '').trim();
  let prompt = SYSTEM_PROMPT;
  if (name) {
    prompt +=
      '\n\nEl usuario se llama ' +
      name +
      '. Usa su nombre de forma natural al saludarlo, ' +
      'cuando le des consejo o lo motives. No abuses de la repeticion del nombre: ' +
      'utilizalo una o dos veces por mensaje como maximo.';
  }
  if (org) {
    prompt +=
      '\n\nEl usuario pertenece a la organizacion llamada "' +
      org +
      '". Puedes mencionar el nombre de su organizacion de forma natural al saludar o cerrar la ' +
      'entrevista, pero no lo repitas en exceso.';
  }
  return prompt;
}

function buildMessages(conversation, userName, organizacion) {
  const system = buildSystemPrompt(userName, organizacion);
  const history = Array.isArray(conversation) ? conversation : [];

  let candidates = history;
  if (candidates.length > 10000) {
    candidates = candidates.slice(-10000);
    if (candidates[0]?.role === 'assistant') candidates = candidates.slice(1);
  }

  const budget = 12000;
  const messages = [{ role: 'system', content: system }];
  let used = Math.floor(system.length / 4);

  const kept = [];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const message = candidates[index];
    const cost = Math.floor((message.content || '').length / 4) + 8;
    if (used + cost > budget) break;
    kept.push(message);
    used += cost;
  }

  return messages.concat(kept.reverse());
}

function getLastUserMessage(conversation) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    if (conversation[index].role === 'user') return conversation[index].content;
  }
  return '';
}

const REASONING_PATTERNS = [
  /^we need to/i,
  /^the user (says|writes|mentions|is)/i,
  /^let'?s (craft|write|respond|do)/i,
  /^as per (the )?instructions/i,
  /^the response must/i,
  /^i should/i,
];

function stripReasoning(text) {
  const clean = (text || '').trim();
  if (!clean) return '';
  for (const pattern of REASONING_PATTERNS) {
    if (pattern.test(clean)) {
      const sentences = clean.split(/(?<=[.!?])\s+/);
      const finalSentence = sentences[sentences.length - 1];
      return finalSentence && finalSentence.length > 3 ? finalSentence.trim() : '';
    }
  }
  return clean;
}

function parseNotes(text) {
  const marker = '###NOTAS###';
  if (!text.includes(marker)) return { content: (text || '').trim(), notes: [] };
  const [head, tail] = text.split(marker);
  let notes = [];
  try {
    const parsed = JSON.parse(tail.trim());
    if (Array.isArray(parsed)) {
      notes = parsed.map((item) => String(item).trim()).filter(Boolean);
    } else if (parsed && Array.isArray(parsed.notas)) {
      notes = parsed.notas.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    notes = tail
      .split(/[\n,;]+/)
      .map((line) =>
        line
          .replace(/^\s*[-*•\d.)]+\s*/, '')
          .replace(/^\s*["\[]|["\]]\s*$/g, '')
          .trim()
      )
      .filter(Boolean);
  }
  return { content: head.trim(), notes };
}

function fallbackNotes(conversation) {
  const lastUser = getLastUserMessage(conversation) || '';
  if (lastUser.length < 15) return [];
  const important = [
    'mes', 'semana', 'dias', 'año', 'anio', 'tiempo', 'jefe', 'carga',
    'trabajo', 'proceso', 'herramienta', 'software', 'licencia', 'acceso',
    'area', 'departamento', 'equipo', 'aprobar', 'aprobaciones', 'licencia',
    'reunion', 'comunicacion', 'proyecto', 'plazo', 'entrega', 'tarea',
  ];
  const lower = lastUser.toLowerCase();
  return important
    .filter((word) => lower.includes(word))
    .slice(0, 1)
    .map(() => lastUser.slice(0, 120));
}

function isRetryableStatus(status) {
  return status === 429 || status === 404 || status === 503;
}

async function fetchCompletion(messages, options = {}) {
  const models = [options.model || MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PainHunter',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 512,
          top_p: options.topP ?? 0.9,
          stream: false,
        }),
      });
      if (!response.ok) {
        if (isRetryableStatus(response.status)) {
          lastError = new Error(`OpenRouter respondio ${response.status}`);
          continue;
        }
        const detail = await response.text().catch(() => '');
        throw new Error(`OpenRouter respondio ${response.status}: ${detail.slice(0, 200)}`);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (content.trim()) return content;
      lastError = new Error('Respuesta vacia');
    } catch (error) {
      lastError = error;
      if (!isRetryableStatus(Number(error.message.match(/\d+/)?.[0]))) {
        throw error;
      }
    }
  }
  throw lastError || new Error('Todos los modelos fallaron');
}

export async function streamReply(conversation, onToken, onNotes, userName, organizacion) {
  if (!API_KEY) {
    onToken(
      'No he podido conectarme: falta la clave de OpenRouter. Añádela como VITE_OPENROUTER_API_KEY en tu archivo .env.'
    );
    return;
  }

  const messages = buildMessages(conversation, userName, organizacion);
  const models = [MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'PainHunter',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          max_tokens: 96,
          top_p: 0.85,
          stream: true,
        }),
      });

      if (!response.ok) {
        lastError = new Error(`OpenRouter respondio ${response.status}`);
        if (isRetryableStatus(response.status)) continue;
        const detail = await response.text().catch(() => '');
        throw new Error(`OpenRouter respondio ${response.status}: ${detail.slice(0, 200)}`);
      }
      if (!response.body) throw new Error('Sin flujo de datos');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      const MARKER = '###NOTAS###';
      const MARKER_LEN = MARKER.length;
      let buffer = '';
      let content = '';
      let receivedAny = false;
      let emittedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separator;
        while ((separator = buffer.indexOf('\n\n')) !== -1) {
          const event = buffer.slice(0, separator);
          buffer = buffer.slice(separator + 2);
          const line = event.trim();
          if (!line.startsWith('data:')) continue;

          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const data = JSON.parse(payload);
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              receivedAny = true;
              content += delta;
              const markerIndex = content.indexOf(MARKER);
              const visibleEnd =
                markerIndex !== -1
                  ? markerIndex
                  : Math.max(0, content.length - (MARKER_LEN - 1));
              if (visibleEnd > emittedLength) {
                onToken(content.slice(emittedLength, visibleEnd));
                emittedLength = visibleEnd;
              }
            }
          } catch {
            /* evento ignorado */
          }
        }
      }

      if (!content.includes(MARKER) && emittedLength < content.length) {
        onToken(content.slice(emittedLength));
        emittedLength = content.length;
      }

      if (content.trim()) {
        const { notes } = parseNotes(content);
        if (notes.length > 0 && onNotes) onNotes(notes);
        else {
          const fallback = fallbackNotes(conversation);
          if (fallback.length > 0 && onNotes) onNotes(fallback);
        }
        return;
      }
      lastError = new Error('Respuesta vacia');
    } catch (error) {
      lastError = error;
      if (!isRetryableStatus(Number(error.message.match(/\d+/)?.[0]))) {
        throw error;
      }
    }
  }
  throw lastError || new Error('Todos los modelos fallaron');
}

export async function generateTitle(conversation) {
  const userTexts = (conversation || [])
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ')
    .slice(0, 800);
  const prompt =
    'Eres un asistente que pone titulos cortos a conversaciones de entrevista laboral y clima de trabajo. ' +
    'El idioma SIEMPRE es español: esta es la regla mas importante, aunque el usuario escriba en otro idioma ' +
    'el titulo debe estar en español. Basandote en lo que el usuario cuenta, genera un titulo de MAXIMO 5 ' +
    'palabras en español, en minusculas y sin puntuacion. ' +
    'Responde DIRECTAMENTE con el titulo, JAMAS expliques tu razonamiento ni analices la instruccion en voz alta. ' +
    'Solo responde con el titulo en español, nada mas.\n\n' +
    `Lo que el usuario ha contado: "${userTexts}"\n\nTitulo en español:`;
  const content = await fetchCompletion([{ role: 'user', content: prompt }], {
    temperature: 0.3,
    maxTokens: 20,
    topP: 0.9,
  });
  return stripReasoning(content.split('\n')[0].trim().slice(0, 60));
}

export async function generateConclusion(conversation, userName, organizacion) {
  const name = (userName || '').trim();
  const org = (organizacion || '').trim();
  const lines = (conversation || [])
    .map((message) => {
      const content = (message.content || '').trim();
      if (!content) return '';
      return message.role === 'user' ? `Usuario: ${content}` : `Sr. Hunter: ${content}`;
    })
    .filter(Boolean);
  const text = lines.join('\n').slice(-3000);

  const prompt =
    'Basandote en la siguiente conversacion de entrevista laboral, responde en espanol con un JSON valido y SIN ' +
    'texto adicional, con exactamente estas siete claves: "conclusion" (maximo 2 frases resumiendo la ' +
    'situacion del empleado en el trabajo: obstaculos, procesos, herramientas o clima que haya mencionado), ' +
    '"es_dolor" (true si la persona describio un problema real que afecte su trabajo o bienestar laboral y que ' +
    'merezca registrarse como nota; false en caso contrario), "recomendacion" (una unica recomendacion ' +
    'practica y accionable de maximo 2 frases, orientada a mejorar su trabajo o resolver el obstaculo), ' +
    '"resumen_rol" (maximo 2 frases resumiendo el puesto y las responsabilidades del empleado segun lo que haya ' +
    'contado; usa "" si no compartio nada al respecto), "tareas_principales" (lista de texto con las 2 a 4 ' +
    'tareas principales que realiza; lista vacia si no las menciono), "herramientas" (lista de herramientas, ' +
    'software o equipos que usa en su trabajo; lista vacia si no menciono ninguna) e "interacciones" (lista de ' +
    'areas, departamentos o roles con los que colabora; lista vacia si no menciono ninguna). ' +
    'NO escribas dialogo ni te dirijas al usuario directamente.\n\n';
  const withName = name ? `El usuario se llama ${name}.\n\n` : '';
  const withOrg = org ? `El usuario pertenece a la organizacion "${org}".\n\n` : '';
  const finalPrompt = prompt + withName + withOrg + `Conversacion:\n${text}\n\nJSON:`;

  const raw = await fetchCompletion([{ role: 'user', content: finalPrompt }], {
    temperature: 0.3,
    maxTokens: 256,
    topP: 0.9,
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let result = {
    conclusion: '',
    es_dolor: false,
    recomendacion: '',
    resumen_rol: '',
    tareas_principales: [],
    herramientas: [],
    interacciones: [],
  };
  if (jsonMatch) {
    try {
      result = { ...result, ...JSON.parse(jsonMatch[0]) };
    } catch {
      result = { ...result, conclusion: raw };
    }
  } else {
    result = { ...result, conclusion: raw };
  }

  const conclusion = String(result.conclusion || '')
    .replace(/^(Conclusion|Conclusión)\s*:?\s*/i, '')
    .replace(/"/g, '')
    .trim()
    .slice(0, 280);

  const keywordMatch = /(dolor|duele|cansancio|agotamiento|agotado|estres|estresado|estresante|fatiga|insomnio|sufre|sufrimiento|angustia|ansiedad|carga|presion|migrana|cefalea)/i.test(
    conclusion
  );

  const recomendacion = String(result.recomendacion || '')
    .replace(/^(Solucion|Solución|Recomendacion|Recomendación)\s*:?\s*/i, '')
    .replace(/Usuario:.*?(?=Sr\. Hunter:|\Z)/is, '')
    .replace(/Sr\. Hunter:\s*/gi, '')
    .replace(/\n+/g, ' ')
    .replace(/"/g, '')
    .trim()
    .slice(0, 280);

  const normalizeList = (value) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(/[;,\n]+/)
        .map((item) => item.trim().replace(/^[-*•\d.)]+\s*/, ''))
        .filter(Boolean);
    }
    return [];
  };

  const resumenRol = String(result.resumen_rol || '')
    .replace(/^(Resumen del rol|Rol|Resumen)\s*:?\s*/i, '')
    .replace(/"/g, '')
    .trim()
    .slice(0, 280);

  return {
    content: conclusion,
    esDolor: Boolean(result.es_dolor) || keywordMatch,
    recomendacion,
    resumenRol,
    tareasPrincipales: normalizeList(result.tareas_principales),
    herramientas: normalizeList(result.herramientas),
    interacciones: normalizeList(result.interacciones),
  };
}
