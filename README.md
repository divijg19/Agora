# ⚔️`Agora`
### *Where ideas fight.*

## 🏛️ What is an Agora?

In ancient Greece, the **Agora** was a public arena for debate- a place where ideas were tested through confrontation, not passive agreement.

## ⚡ What is this?

In layman's terms: an **AI debate arena**.

- Pick two AI fighters (personas)
- Enter a topic
- Watch a structured, turn-based debate unfold live
- Decide the winner (or let an AI judge do it)

👉 It feels like a **game**, not a chatbot.

---

## 🎮 Core Loop

1. Enter the arena  
2. Choose fighters  
3. Set topic  
4. Watch the duel (live streaming)  
5. Declare the winner  

---

## 🧠 Key Ideas

- **Personas > generic AI**  
- **Turns > free-form chat**  
- **Pacing > raw output**  

Every debate is:
- structured  
- concise  
- intentionally dramatic  

## 🎯 v1 Scope

* 2 fighters
* 4–6 turns
* single topic
* no auth
* no persistence

## 🧩 Features

- ⚔️ Persona-based fighters  
- 🔄 Turn-based debate engine  
- ⚡ Live streaming (SSE)  
- 🧠 AI judge (optional)  
- 🎮 Retro arena-style UI  

---

## 🏗️ Architecture

```

[ Browser ]
│
│ HTTP + SSE
▼
[ FastAPI Backend ]
├── Debate Engine
├── Persona System
├── Judge System
└── Stream Layer

```

---

## ⚙️ Tech Stack

**Backend**
- Python
- FastAPI
- Async (async/await)
- SSE

**LLM**
- Pluggable (OpenAI / local)

**Frontend**
- Lightweight, retro-inspired UI
- Streaming text rendering

---

## 📂 Structure

```

agora/
├── apps/
│   ├── engine/
│   ├── core/
│   ├── models/
│   ├── llm/
│   └── web/
├── docs/
├── infra/
├── package.json
└── pyproject.toml

````

---

## 🔄 API (Minimal)

### Start
`POST /debate/start`

```json
{
  "topic": "Is AI dangerous?",
  "fighter_a": "Economist",
  "fighter_b": "Philosopher",
  "auto_judge": true
}
````

### Stream

`GET /debate/stream/{session_id}`

Events:

* `turn_start`
* `chunk`
* `turn_end`
* `result`

---

## 📚 Docs

Detailed documentation lives in `/docs`:

* architecture
* prompt design
* personas
* backend internals
* frontend UX

## ⚔️ Philosophy

> AI shouldn’t just answer.
> It should **argue, perform, and compete.**

---

### Enter the arena.
