<div align="center">

<img src=".github/logo.svg" alt="Logo do RelayKit" width="120" height="120">

# RelayKit

**Um demo funcional de microsserviços com um gateway que degrada com elegância.**<br>
Um gateway distribui texto para três serviços especialistas, agrega as respostas e continua respondendo quando um deles cai. Um dashboard ao vivo mostra cada nó e cada circuit breaker.

[![CI](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml/badge.svg)](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/obrenoalvim/relaykit?style=flat&logo=github&color=38bdf8)](https://github.com/obrenoalvim/relaykit/stargazers)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](#como-rodar)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#estrutura-do-projeto)

[English](README.md) · **Português**

[O que faz](#o-que-faz) · [Arquitetura](#arquitetura) · [Como rodar](#como-rodar) · [API](#api) · [Testes](#testes) · [Perguntas frequentes](#perguntas-frequentes)

</div>

---

Um demo funcional de microsserviços. Um gateway repassa texto pra três
serviços especialistas, agrega as respostas e degrada com elegância quando um
deles cai. Um dashboard mostra o pipeline ao vivo: qual nó está de pé, qual
circuit breaker abriu, o que cada especialista devolveu.

## O que faz

Envie um parágrafo e o gateway distribui a requisição em paralelo pra três
serviços independentes:

- **stats-service** conta palavras, frases e sílabas, e calcula a
  legibilidade com a fórmula Flesch Reading Ease.
- **lang-service** detecta o idioma por frequência de stopwords, cobrindo
  inglês, português, espanhol, francês e alemão.
- **keyword-service** ranqueia termos por frequência depois de remover
  stopwords.

O gateway chama os três em paralelo, espera com timeout, tenta de novo uma
vez em caso de falha, e abre um circuit breaker por serviço depois de falhas
repetidas. Se um especialista fica inacessível, a resposta ainda volta com os
outros dois resultados preenchidos e o que falhou marcado como indisponível.
O status HTTP reflete isso: `200` quando todos os especialistas respondem,
`207` quando um ou mais não respondem.

## Arquitetura

```
frontend (3000)
   |
   v
gateway (4000)  [timeout, retry e circuit breaker por serviço]
   |-- stats-service   (4001)   contagem de palavras/frases, score Flesch
   |-- lang-service    (4002)   detecção de idioma por frequência de stopwords
   |-- keyword-service (4003)   ranking de palavras-chave por frequência
```

Cada especialista é um app Express pequeno com duas rotas: `POST /analyze` e
`GET /health`. O gateway não guarda regra de negócio nenhuma; ele só roteia,
agrega e se protege de especialistas lentos ou mortos.

## Como rodar

Você precisa do Docker.

```bash
docker compose up --build
```

Abra `http://localhost:3000`. O gateway escuta na porta `4000`, os
especialistas de `4001` a `4003`.

Pra ver a degradação em ação, pare um especialista com a stack rodando:

```bash
docker compose stop lang-service
```

Envie o texto de novo. O card de idioma mostra "unavailable" enquanto stats e
keywords continuam funcionando.

## Desenvolvimento local sem Docker

```bash
npm install
npm run dev:gateway    # terminal 1
npm run dev:stats      # terminal 2
npm run dev:lang       # terminal 3
npm run dev:keyword    # terminal 4
npm run dev:frontend   # terminal 5
```

O frontend lê a URL do gateway na variável `NEXT_PUBLIC_GATEWAY_URL` (padrão
`http://localhost:4000`).

## API

**POST /analyze**

```json
{ "text": "seu paragrafo aqui" }
```

Retorna:

```json
{
  "status": "complete",
  "results": {
    "stats": { "status": "ok", "data": { "words": 12, "sentences": 1, "...": "..." } },
    "language": { "status": "ok", "data": { "language": "en", "confidence": "high" } },
    "keywords": { "status": "ok", "data": { "keywords": [{ "term": "example", "count": 2 }] } }
  }
}
```

Quando um especialista falha, a entrada dele vira
`{ "status": "unavailable", "reason": "circuit_open" }` (ou a mensagem de
erro original) e o `status` no topo muda pra `"degraded"`.

**GET /health**

Retorna o status do próprio gateway mais o alcance de cada especialista e o
estado do circuit breaker (`closed`, `open`, `half-open`).

## Testes

A bateria de testes roda em três níveis.

```bash
npm run test:unit          # logica pura + rotas HTTP, por servico, rede mockada
npm run test:integration   # gateway + servidores reais dos especialistas, HTTP real, sem Docker
npm test                   # os dois acima
```

O CI adiciona um quarto nível: builda todas as imagens Docker, sobe a stack
inteira com `docker compose up`, bate no gateway real via HTTP, para o
`lang-service` no meio pra confirmar o caminho de degradação `207`, e sobe
ele de novo. Veja `.github/workflows/ci.yml`.

Os testes unitários cobrem a máquina de estados do circuit breaker
diretamente (fechado, aberto, meio-aberto, recuperação) com um relógio
injetável, então os testes rodam em milissegundos em vez de esperar timers
reais.

## Estrutura do projeto

```
services/
  gateway/           gateway de API: circuit breaker, retry, timeout, agregacao
  stats-service/      estatisticas de texto e legibilidade Flesch
  lang-service/       deteccao de idioma por stopwords
  keyword-service/    extracao de palavras-chave por frequencia
frontend/            dashboard Next.js com diagrama de pipeline ao vivo
tests/integration/   testes cross-service contra servidores HTTP reais
docker-compose.yml   orquestra os cinco containers com healthchecks
```

## Decisões de design

O circuit breaker e a lógica de retry foram escritos à mão em vez de vir de
uma biblioteca. Os dois são pequenos, e escrevê-los deixa o comportamento de
resiliência algo que dá pra ler num arquivo só
(`services/gateway/src/circuitBreaker.ts`) em vez de algo que você configura
pelas opções de uma dependência.

A detecção de idioma usa frequência de stopwords em vez de um modelo
estatístico. Ela só precisa distinguir cinco idiomas pra um demo, e uma
heurística sem dependência externa é determinística, rápida de testar e não
carrega nenhum arquivo de dados externo.

---

## Perguntas frequentes

**O que significa o status 207?**
O gateway devolve `200` quando todos os especialistas respondem e `207` quando um ou mais não responderam. A resposta ainda traz os resultados que voltaram.

**Preciso de Docker?**
O Docker sobe a stack completa com `docker compose up --build`. Sem Docker, rode os cinco processos com os scripts npm de [Desenvolvimento local sem Docker](#desenvolvimento-local-sem-docker).

**O circuit breaker e o retry vêm de uma biblioteca?**
Não. Foram escritos à mão, e o circuit breaker fica em um arquivo só: `services/gateway/src/circuitBreaker.ts`.

**Como ele detecta o idioma?**
Pela frequência de stopwords em inglês, português, espanhol, francês e alemão. É uma heurística sem dependências, não um modelo estatístico.

**Como vejo a degradação?**
Rode `docker compose stop lang-service` com a stack no ar e envie o texto de novo. O card de idioma mostra "unavailable" enquanto estatísticas e palavras-chave continuam funcionando.

## Mais do mesmo autor

- [**status-hub**](https://github.com/obrenoalvim/status-hub): um grid só para toda página de status que você confere.
- [**echoport**](https://github.com/obrenoalvim/echoport): scanner de portas localhost em tempo real para devs.

## Contribuindo

Bug ou ideia? Abra uma issue ou um PR. Veja o [CONTRIBUTING.md](CONTRIBUTING.md) e o [changelog](CHANGELOG.md).

## Licença

MIT. Veja [LICENSE](LICENSE).

---

<div align="center">

Se o RelayKit te ajudou a entender circuit breakers, uma ⭐ ajuda outras pessoas a encontrá-lo.

<sub>**Tópicos:** microservices · api-gateway · circuit-breaker · resilience · graceful-degradation · fault-tolerance · distributed-systems · docker-compose · nextjs · typescript</sub>

</div>
