import urllib.request, json

users = {
  "rrintec-005": ("Harrys Rodriguez", "vendedor online", "Presión por cierre rápido. Falta de herramientas. Sobrecarga."),
  "rrintec-006": ("José Morillo", "compras e inventario operativo", "Falta actualización datos. Confusión procesos. Sobrecarga."),
  "rrintec-007": ("José Duarte", "ingeniero soporte técnico y redes", "Problemas servidores externos. Falta de apoyo técnico."),
  "rrintec-008": ("Christopher Peña", "mantenimiento y soporte", "Alta carga. Problemas clientes. Falta herramientas."),
  "rrintec-009": ("Jhonniel Querales", "experto electrónica y soporte", "Problemas componentes. Falta actualización inventario."),
  "rrintec-010": ("Ángel Reyes", "vigilante y logística tienda", "Problemas control acceso. Falta sistema."),
  "rrintec-011": ("Kimberly Mendoza", "control inventario, facturas y cuentas", "Problemas cuentas. Falta software integrado."),
}

base = "https://pain-hunter-default-rtdb.europe-west1.firebasedatabase.app"
key = "AIzaSyBfFQ5oXxi1NvwT5RJ4J84vFLWZBsnBHQY"

counts = {"rrintec-005": 9, "rrintec-006": 10, "rrintec-007": 11, "rrintec-008": 5, "rrintec-009": 9, "rrintec-010": 10, "rrintec-011": 11}

for uid, (name, role, notas) in users.items():
    chats = {}
    for i in range(counts[uid]):
        chat_id = f"{uid}-sim-{i+1}"
        chats[chat_id] = {
            "id": chat_id,
            "title": f"Entrevista - {name}",
            "createdAt": 1761570000000 + i*1000,
            "updatedAt": 1761570000000 + i*1000,
            "organizacion": "RRIntec",
            "messages": [
                {"id":"m1","role":"user","content":"Soy " + name + ", " + role + "."},
                {"id":"m2","role":"assistant","content":"Gracias. ¿Qué procesos o herramientas te generan más problemas hoy?"},
                {"id":"m3","role":"user","content":"Hay problemas con " + notas.split(".")[0].lower() + "."}
            ],
            "notas": [{"text": notas}],
            "esDolor": True,
            "conclusion": f"{name} presenta obstáculos relacionados con {notas.lower()}.",
            "recomendacion": f"Revisar procesos y herramientas para {name}.",
            "resumenRol": f"{name}: {role} con obstáculos.",
            "tareasPrincipales": [role],
            "herramientas": ["Herramientas básicas"],
            "interacciones": ["Equipo"],
            "procesos": ["Procesos operativos"],
            "objetivos": ["Mejorar eficiencia"],
            "importante": True
        }
    url = f"{base}/conversations/{uid}.json?auth={key}"
    req = urllib.request.Request(url, data=json.dumps(chats).encode('utf-8'), headers={"Content-Type":"application/json"}, method="PUT")
    try:
        resp = urllib.request.urlopen(req)
        print(f"OK {uid}: {counts[uid]} conversaciones insertadas")
    except Exception as e:
        print(f"FAIL {uid}: {e.code if hasattr(e,'code') else e}")
