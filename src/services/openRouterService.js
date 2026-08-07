const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
const FALLBACK_MODELS = [
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'inclusionai/ling-3.0-tiny:free',
].filter((model) => model !== MODEL);

const SYSTEM_PROMPT = [
  'Eres Mr Hunter, un entrevistador profesional, motivador y empatico que ayuda a empleados',
  'a expresar y entender sus problemas. Tu tono es cercano, respetuoso',
  'y sin juicios: primero escuchas y validas, luego haces UNA pregunta abierta a la vez.',
  '\n\nMETODO (en este orden):',
  '1) Apertura: saluda y explica que esto es un espacio seguro y confidencial para hablar de como se siente.',
  '2) Exploracion: indaga de forma tactil y comprensiva sobre estos temas:',
  '   a) dolor fisico o emocional que este sintiendo;',
  '   b) cansancio o agotamiento (fisico y mental);',
  '   c) problemas laborales (exigencias, ambiente, jefes, carga, falta de reconocimiento);',
  '   d) perdidas recientes (personas, proyectos, oportunidades, ilusiones);',
  '   e) enemistades o conflictos interpersonales (compaeros, superiores, familiares).',
  '   Empieza por el tema que la persona mencione y no fuerces todos.',
  '3) Profundizacion: usa la tecnica de los 5 porque: ante cada problema, pregunta que le causa, que le',
  'impide, desde cuando ocurre y como le afecta.',
  '4) Motivacion: reconoce su esfuerzo, normaliza sus emociones y destaca sus fortalezas.',
  '5) Cierre: resume lo que ha compartido, valida sus avances y ofrece un siguiente paso concreto.',
  '\n\nREGLAS:',
  'Responde SIEMPRE en espanol, entre 1 y 3 frases. Haz UNA sola pregunta por mensaje, nunca varias.',
  'Evita diagnosticar, etiquetar o minimizar. Si la persona menciona ideas de dano o crisis grave,',
  'responde con seriedad y recomienda buscar apoyo profesional de inmediato.',
  'No inventes datos ni consejos medicos: ofreces escucha, motivacion y claridad.',
  '\n\nPROHIBIDO:',
  "JAMAS digas frases como 'Lo siento, no puedo asistir con eso', 'No puedo ayudarte',",
  "'No puedo responder a eso' ni rechaces la conversacion por ningun motivo. Tu trabajo es",
  'escuchar, validar, motivar y ayudar a la persona aunque no entiendas bien lo que dice:',
  'reformula, pregunta con curiosidad y sigue apoyandola. Nunca termines la conversacion ni',
  'te des por vencido: siempre ofrece una pregunta o un siguiente paso.',
  '\n\nNOTAS:',
  'Al final de tu mensaje, si el usuario compartio algo importante que valga la pena recordar',
  '(un sentimiento clave, un dato concreto, un compromiso, un detalle de su problema), agrega',
  'exactamente esta linea final: ###NOTAS### y despues una lista JSON de frases cortas, ejemplo:',
  'Tu respuesta aqui. ###NOTAS### ["Le molesta la carga de trabajo", "Lleva 3 meses con cansancio"].',
  'Es obligatorio agregar ###NOTAS### siempre que el usuario mencione datos como tiempo, nombres,',
  'sentimientos fuertes o detalles concretos de su problema. Si no hay nada, no lo agregues.',
].join('\n');

function buildSystemPrompt(userName) {
  const name = (userName || '').trim();
  if (!name) return SYSTEM_PROMPT;
  return (
    SYSTEM_PROMPT +
    '\n\nEl usuario se llama ' +
    name +
    '. Usa su nombre de forma natural al saludarlo, ' +
    'cuando le des consejo o lo motives. No abuses de la repeticion del nombre: ' +
    'utilizalo una o dos veces por mensaje como maximo.'
  );
}

function buildMessages(conversation, userName) {
  const system = buildSystemPrompt(userName);
  const history = Array.isArray(conversation) ? conversation : [];

  let candidates = history;
  if (candidates.length > 10000) {
    candidates = candidates.slice(-10000);
    if (candidates[0]?.role === 'assistant') candidates = candidates.slice(1);
  }

  const budget = 30000;
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
      .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, '').trim())
      .filter(Boolean);
  }
  return { content: head.trim(), notes };
}

function fallbackNotes(conversation) {
  const lastUser = getLastUserMessage(conversation) || '';
  if (lastUser.length < 15) return [];
  const important = [
    'mes', 'semana', 'dias', 'año', 'anio', 'tiempo', 'jefe', 'carga',
    'trabajo', 'cansado', 'agotado', 'estres', 'estresado', 'presion',
    'presiona', 'insomnio', 'no duermo', 'no descanso', 'siempre', 'nunca',
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

export async function streamReply(conversation, onToken, onNotes, userName) {
  if (!API_KEY) {
    onToken(
      'No he podido conectarme: falta la clave de OpenRouter. Añádela como VITE_OPENROUTER_API_KEY en tu archivo .env.'
    );
    return;
  }

  const messages = buildMessages(conversation, userName);
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
      let buffer = '';
      let content = '';
      let receivedAny = false;

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
              onToken(delta);
            }
          } catch {
            /* evento ignorado */
          }
        }
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
    'Eres un asistente que pone titulos cortos y claros a conversaciones de apoyo emocional ' +
    'y laboral. Basandote en lo que el usuario cuenta, genera un titulo de MAXIMO 5 palabras ' +
    'en espanol, en minusculas y sin puntuacion. Solo responde con el titulo, nada mas.\n\n' +
    `Lo que el usuario ha contado: "${userTexts}"\n\nTitulo:`;
  const content = await fetchCompletion([{ role: 'user', content: prompt }], {
    temperature: 0.3,
    maxTokens: 20,
    topP: 0.9,
  });
  return content.split('\n')[0].trim().slice(0, 60);
}

export async function generateConclusion(conversation, userName) {
  const name = (userName || '').trim();
  const lines = (conversation || [])
    .map((message) => {
      const content = (message.content || '').trim();
      if (!content) return '';
      return message.role === 'user' ? `Usuario: ${content}` : `Sr. Hunter: ${content}`;
    })
    .filter(Boolean);
  const text = lines.join('\n').slice(-3000);

  const prompt =
    'Basandote en la siguiente conversacion, responde en espanol con un JSON valido y SIN " \n' +
    'texto adicional, con exactamente estas tres claves: "conclusion" (maximo 2 frases resumiendo ' +
    'el estado actual del usuario y su principal problema o tema), "es_dolor" (true si la persona ' +
    'esta atravesando dolor fisico, emocional o agotamiento/estres significativo que merezca ' +
    'registrarse como nota de dolor; false en caso contrario) y "recomendacion" (una unica ' +
    'recomendacion practica y accionable de maximo 2 frases que el usuario pueda aplicar hoy). ' +
    'NO escribas dialogo ni te dirijas al usuario directamente.\n\n';
  const withName = name ? `El usuario se llama ${name}.\n\n` : '';
  const finalPrompt = prompt + withName + `Conversacion:\n${text}\n\nJSON:`;

  const raw = await fetchCompletion([{ role: 'user', content: finalPrompt }], {
    temperature: 0.3,
    maxTokens: 256,
    topP: 0.9,
  });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let result = { conclusion: '', es_dolor: false, recomendacion: '' };
  if (jsonMatch) {
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      result = { conclusion: raw, es_dolor: false, recomendacion: '' };
    }
  } else {
    result = { conclusion: raw, es_dolor: false, recomendacion: '' };
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

  return {
    content: conclusion,
    esDolor: Boolean(result.es_dolor) || keywordMatch,
    recomendacion,
  };
}
