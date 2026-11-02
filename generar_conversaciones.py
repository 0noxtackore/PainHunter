import json, random

random.seed(42)

USERS = {
    "rrintec-001": {"name":"Anthony Gonzales","role":"empleado","gender":"masculino"},
    "rrintec-002": {"name":"Rosaura Parra","role":"empleado","gender":"femenino"},
    "rrintec-003": {"name":"Nelson Quintero","role":"empleado","gender":"masculino"},
    "rrintec-004": {"name":"Wilder Salazar","role":"empleado","gender":"masculino"},
    "rrintec-005": {"name":"Harrys Rodriguez","role":"empleado","gender":"masculino"},
    "rrintec-006": {"name":"José Morillo","role":"empleado","gender":"masculino"},
    "rrintec-007": {"name":"José Duarte","role":"empleado","gender":"masculino"},
    "rrintec-008": {"name":"Christopher Peña","role":"empleado","gender":"masculino"},
    "rrintec-009": {"name":"Jhonniel Querales","role":"empleado","gender":"masculino"},
    "rrintec-010": {"name":"Ángel Reyes","role":"empleado","gender":"masculino"},
    "rrintec-011": {"name":"Kimberly Mendoza","role":"empleado","gender":"femenino"},
}

CAREERS = ["Operativo", "Atención", "Desarrollo", "Comercial"]
TITLES = ["Entrevista laboral - RRIntec", "Seguimiento - RRIntec"]

CONCLUSIONS = {
    "alto": ["Carga alta y presión por plazos.", "Sobrecarga por tareas combinadas.", "Presión por cumplimiento de plazos."],
    "media": ["Carga media con algunos problemas.", "Momentos de organización deficiente."],
    "bajo": ["Sin problemas operativos críticos.", "Fluido y organizado."],
}

RECOMMENDATIONS = {
    "alto": ["Equilibrar carga de trabajo con líder.", "Priorizar tareas por urgencia.", "Revisar distribución de plazos."],
    "media": ["Mejorar organización diaria.", "Planificación con bloques de tiempo."],
    "bajo": ["Mantener procedimiento actual.", "Soporte continuo."],
}

def make_chat(idx, uid):
    u = USERS[uid]
    title = f"{u['name']}" if idx == 0 else f"Seguimiento - {u['name']}"
    created_at = 1761570000000 + idx * 86400000
    # Determinar dolor según random.randint(0,100) < 60 -> 60% dolor
    dolor = random.random() < 0.6
    conclusion = random.choice(CONCLUSIONS["alto"] if dolor else CONCLUSIONS["bajo"])
    rec = random.choice(RECOMMENDATIONS["alto"] if dolor else RECOMMENDATIONS["bajo"])
    messages = [
        {"id": f"m{idx*2+1}","role":"user","content":f"{u['name']}: cargo y mis tareas."},
        {"id": f"m{idx*2+2}","role":"assistant","content":f"¿Detalle del cargo, a quién reportas y qué proceso genera más demora?"},
    ]
    if idx % 2 == 0:
        messages.append({"id": f"m{idx*2+3}","role":"user","content":"Hay momentos en que me cuesta cumplir plazos por carga de trabajo."})
        messages.append({"id": f"m{idx*2+4}","role":"assistant","content":"¿Qué tarea consume más tiempo actualmente?"})
    notas = []
    if dolor:
        notas.append({"text": random.choice(["Carga de trabajo elevada.", "Presión por plazos.", "Sobrecarga combinada.", "Momentos difíciles con distribución."])})
    else:
        notas.append({"text": random.choice(["Fluido en la ejecución.", "Organización correcta.", "Cumple plazos OK."])})
    tareas = random.choice(["Operativas asignadas", "Atención y control", "Desarrollo técnico", "Operativas con plazos"])
    herramientas = random.choice(["Zoom", "Sistema inventario", "IDE", "Agenda", "Herramientas propias"])
    interacciones = random.choice(["Líder de equipo", "Clientes", "Equipo técnico"])
    procesos = random.choice(["Seguimiento de asignaciones", "Atención", "Control", "Desarrollo"])
    objetivos = random.choice(["Cumplir con plazos asignados", "Eficiencia", "Cumplimiento normas", "Entrega proyectos"])
    return {
        "id": f"{uid}-sim-{idx}",
        "title": title,
        "createdAt": created_at,
        "updatedAt": created_at,
        "organizacion": "RRIntec",
        "messages": messages,
        "notas": notas,
        "esDolor": dolor,
        "conclusion": conclusion,
        "recomendacion": rec,
        "resumenRol": u["name"],
        "tareasPrincipales": [tareas],
        "herramientas": [herramientas],
        "interacciones": [interacciones],
        "procesos": [procesos],
        "objetivos": [objetivos],
        "importante": True if dolor else False,
    }

TARGET = {"rrintec-001":9,"rrintec-002":10,"rrintec-003":11,"rrintec-004":5,"rrintec-005":9,"rrintec-006":10,"rrintec-007":11,"rrintec-008":9,"rrintec-009":10,"rrintec-010":11,"rrintec-011":5}

result = {}
for uid, count in TARGET.items():
    result[uid] = {f"{uid}-sim-{i}": make_chat(i, uid) for i in range(count)}

with open("conversaciones_completas.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False)

print("Generado:", sum(len(v) for v in result.values()), "chats")
print("Distribución:")
for u, c in TARGET.items():
    print(f"  {u}: {c}")
